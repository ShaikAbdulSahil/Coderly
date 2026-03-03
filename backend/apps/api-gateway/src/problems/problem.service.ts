import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { RedisCacheService } from '../shared/cache/redis-cache.service';

/** gRPC client interface matching the ProblemService proto */
interface ProblemServiceGrpc {
    getProblemById(data: { id: string }): Observable<any>;
    getProblemBySlug(data: { slug: string }): Observable<any>;
    getProblems(data: { category: string; difficulty: string; page: number; limit: number }): Observable<any>;
    createProblem(data: any): Observable<any>;
    updateProblem(data: any): Observable<any>;
    deleteProblem(data: { id: string }): Observable<any>;
}

/**
 * ProblemService (Gateway) — wraps gRPC calls and adds smart Redis caching.
 *
 * Caching strategy:
 *   - GET by ID:     Cache 10 min + ETag (key: "problem:{id}")
 *   - GET by Slug:   Redis slug→ID cross-reference 10 min (key: "problem:slug:{slug}")
 *   - GET list:      Cache 90 sec (key: "problems:{category}:{difficulty}:{page}:{limit}")
 *   - CREATE:        Invalidate list cache
 *   - UPDATE:        Invalidate that problem's cache + list cache
 *   - DELETE:        Invalidate that problem's cache + list cache
 */
@Injectable()
export class ProblemService implements OnModuleInit {
    private readonly logger = new Logger(ProblemService.name);
    private grpc: ProblemServiceGrpc;

    private readonly TTL_PROBLEM = 600;   // 10 minutes
    private readonly TTL_LIST = 90;       // 90 seconds

    constructor(
        @Inject('PROBLEM_PACKAGE') private readonly client: ClientGrpc,
        private readonly cache: RedisCacheService,
    ) { }

    onModuleInit() {
        this.grpc = this.client.getService<ProblemServiceGrpc>('ProblemService');
    }

    // ─── Read (with caching) ──────────────────────────────────────────

    /**
     * Fetch a problem by ID. Returns { data, etag }.
     * - Cache HIT → returns from Redis, includes stored ETag.
     * - Cache MISS → fetches from gRPC, stores with ETag.
     */
    async getById(id: string): Promise<{ data: any; etag: string }> {
        const cacheKey = `problem:${id}`;
        const { data: cached, etag } = await this.cache.getWithEtag(cacheKey);

        if (cached && etag) {
            this.logger.debug(`Cache HIT for problem ${id}`);
            return { data: cached, etag };
        }

        this.logger.debug(`Cache MISS for problem ${id}`);
        const problem = await firstValueFrom(this.grpc.getProblemById({ id }));
        const newEtag = await this.cache.setWithEtag(cacheKey, problem, this.TTL_PROBLEM);
        return { data: problem, etag: newEtag };
    }

    /**
     * Fetch a problem by slug using a Cache-Aside two-level lookup:
     *   1. Try Redis for slug→id mapping.
     *   2. On miss → call gRPC getProblemBySlug, then cache via getById pipeline.
     */
    async getBySlug(slug: string): Promise<{ data: any; etag: string }> {
        const slugKey = `problem:slug:${slug}`;

        // Level 1: Try slug → id cross-reference
        const cachedId = await this.cache.get<string>(slugKey);
        if (cachedId) {
            this.logger.debug(`Cache HIT for slug ${slug} (id=${cachedId})`);
            return this.getById(cachedId);
        }

        // Level 2: gRPC call, then populate both caches
        this.logger.debug(`Cache MISS for slug ${slug}`);
        const problem = await firstValueFrom(this.grpc.getProblemBySlug({ slug }));

        // Store slug→id mapping
        await this.cache.set(slugKey, problem.id, this.TTL_PROBLEM);

        // Store full problem with ETag
        const cacheKey = `problem:${problem.id}`;
        const etag = await this.cache.setWithEtag(cacheKey, problem, this.TTL_PROBLEM);
        return { data: problem, etag };
    }

    async getList(category: string, difficulty: string, page: number, limit: number) {
        const cacheKey = `problems:${category || 'all'}:${difficulty || 'all'}:${page}:${limit}`;

        const cached = await this.cache.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache HIT for problem list`);
            return cached;
        }

        this.logger.debug(`Cache MISS for problem list`);
        const result = await firstValueFrom(
            this.grpc.getProblems({ category, difficulty, page, limit }),
        );

        await this.cache.set(cacheKey, result, this.TTL_LIST); // 90 sec TTL for lists
        return result;
    }

    // ─── Write (invalidate cache) ─────────────────────────────────────

    async create(data: any) {
        const result = await firstValueFrom(this.grpc.createProblem(data));
        await this.invalidateListCache();
        return result;
    }

    async update(id: string, data: any) {
        const result = await firstValueFrom(this.grpc.updateProblem({ id, ...data }));
        await Promise.all([
            this.cache.del(`problem:${id}`),
            this.cache.del(`problem:${id}:etag`),
            this.invalidateListCache(),
        ]);
        return result;
    }

    async delete(id: string) {
        const result = await firstValueFrom(this.grpc.deleteProblem({ id }));
        await Promise.all([
            this.cache.del(`problem:${id}`),
            this.cache.del(`problem:${id}:etag`),
            this.invalidateListCache(),
        ]);
        return result;
    }

    // ─── Helper ───────────────────────────────────────────────────────

    private async invalidateListCache() {
        await this.cache.delPattern('problems:*');
    }
}
