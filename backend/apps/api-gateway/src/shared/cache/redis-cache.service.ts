import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';

/**
 * RedisCacheService — get/set/del + ETag helpers around ioredis.
 *
 * Used by gateway services to cache frequently-accessed data like problems.
 * Default TTL: 5 minutes.
 */
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
    private readonly logger = new Logger(RedisCacheService.name);
    private readonly client: Redis;
    private readonly DEFAULT_TTL = 300; // seconds (5 minutes)

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            keyPrefix: 'coderly:cache:',
            retryStrategy: (times) => Math.min(times * 200, 3000),
        });

        this.client.on('connect', () => this.logger.log('✅ Redis cache connected'));
        this.client.on('error', (err) => this.logger.error(`Redis cache error: ${err.message}`));
    }

    /** Get a cached value. Returns null if not found. */
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            this.logger.warn(`Cache get failed for "${key}": ${(err as Error).message}`);
            return null;
        }
    }

    /** Set a value in cache with optional TTL (default 5 minutes) */
    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const ttl = ttlSeconds ?? this.DEFAULT_TTL;
            await this.client.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (err) {
            this.logger.warn(`Cache set failed for "${key}": ${(err as Error).message}`);
        }
    }

    /** Delete a specific cache key */
    async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (err) {
            this.logger.warn(`Cache del failed for "${key}": ${(err as Error).message}`);
        }
    }

    /** Delete all cache keys matching a pattern (e.g., "problems:*") */
    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(`coderly:cache:${pattern}`);
            if (keys.length > 0) {
                const stripped = keys.map((k) => k.replace('coderly:cache:', ''));
                await Promise.all(stripped.map((k) => this.client.del(k)));
            }
        } catch (err) {
            this.logger.warn(`Cache delPattern failed for "${pattern}": ${(err as Error).message}`);
        }
    }

    // ─── ETag helpers ─────────────────────────────────────────────────

    /**
     * Generate a deterministic ETag from a value (sha1 of JSON).
     * Returns a quoted string, e.g. `"a1b2c3d4"` — matches HTTP ETag format.
     */
    generateETag(value: any): string {
        const hash = createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 16);
        return `"${hash}"`;
    }

    /**
     * Set a value + its ETag atomically using a Redis pipeline.
     * Two keys: `{key}` for the value, `{key}:etag` for the ETag string.
     */
    async setWithEtag(key: string, value: any, ttlSeconds: number): Promise<string> {
        const etag = this.generateETag(value);
        try {
            const pipeline = this.client.pipeline();
            pipeline.set(key, JSON.stringify(value), 'EX', ttlSeconds);
            pipeline.set(`${key}:etag`, etag, 'EX', ttlSeconds);
            await pipeline.exec();
        } catch (err) {
            this.logger.warn(`Cache setWithEtag failed for "${key}": ${(err as Error).message}`);
        }
        return etag;
    }

    /**
     * Get a cached value AND its stored ETag in one round-trip (pipeline).
     * Returns `{ data, etag }` — both may be null on miss.
     */
    async getWithEtag<T>(key: string): Promise<{ data: T | null; etag: string | null }> {
        try {
            const [rawData, rawEtag] = await this.client
                .pipeline()
                .get(key)
                .get(`${key}:etag`)
                .exec() as [any, any];

            const data = rawData?.[1] ? JSON.parse(rawData[1]) as T : null;
            const etag = rawEtag?.[1] as string | null;
            return { data, etag };
        } catch (err) {
            this.logger.warn(`Cache getWithEtag failed for "${key}": ${(err as Error).message}`);
            return { data: null, etag: null };
        }
    }

    /** Expose the raw client (for Pub/Sub subscriber connections etc.) */
    getClient(): Redis {
        return this.client;
    }

    async onModuleDestroy() {
        await this.client.quit();
    }
}
