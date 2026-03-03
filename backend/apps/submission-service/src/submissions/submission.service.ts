import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { SubmissionRepository } from './submission.repository';
import { Submission } from './interfaces/submission.interface';

/** Languages we accept for code execution */
const SUPPORTED_LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c'];

/**
 * SubmissionService — business logic for code submissions.
 *
 * Flow:
 *   1. Validate input (language, required fields)
 *   2. Save to PostgreSQL via repository
 *   3. Push execution job to BullMQ
 *   4. Execution Engine picks it up asynchronously
 */
@Injectable()
export class SubmissionService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(SubmissionService.name);
    private readonly publisher: Redis;

    constructor(
        private readonly submissions: SubmissionRepository,
        @InjectQueue('code-execution') private readonly executionQueue: Queue,
    ) {
        // Dedicated Redis connection for publishing (cannot reuse subscriber connections)
        this.publisher = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => Math.min(times * 200, 3000),
        });
    }

    onModuleInit() {
        this.publisher.on('connect', () => this.logger.log('✅ Result publisher connected to Redis'));
        this.publisher.on('error', (err) => this.logger.warn(`Publisher error: ${err.message}`));
    }

    async onModuleDestroy() {
        await this.publisher.quit();
    }

    // ─── Create ───────────────────────────────────────────────────────

    async createSubmission(userId: string, problemId: string, language: string, codeBody: string, isTestRun = false) {
        // Guard: required fields
        if (!userId || !problemId || !language || !codeBody) {
            throw new Error('userId, problemId, language, and codeBody are all required');
        }

        // Guard: supported language
        if (!SUPPORTED_LANGUAGES.includes(language.toLowerCase())) {
            throw new Error(`Language "${language}" is not supported. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
        }

        // Step 1: Save to DB OR generate a random ID for test runs
        let submissionId: string;
        let createdDto: any;

        if (isTestRun) {
            submissionId = `test-${Math.random().toString(36).substring(2, 10)}`;
            createdDto = {
                id: submissionId,
                user_id: userId,
                problem_id: problemId,
                language,
                code_body: codeBody,
                status: 'pending',
                execution_time: 0,
                memory_used: 0,
                created_at: new Date().toISOString(),
            };
            this.logger.log(`🧪 Test run job generated: ${submissionId}`);
        } else {
            const submission = await this.submissions.create(userId, problemId, language, codeBody);
            submissionId = submission.id;
            createdDto = this.toProto(submission);
            this.logger.log(`✅ Submission ${submissionId} created and queued`);
        }

        // Step 2: Push job to BullMQ for async execution
        await this.executionQueue.add('execute', {
            submissionId,
            userId,
            problemId,
            language,
            codeBody,
        }, {
            attempts: 2,
            backoff: { type: 'fixed', delay: 3000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });

        return createdDto;
    }

    // ─── Read ─────────────────────────────────────────────────────────

    async getSubmission(id: string) {
        if (!id) throw new Error('Submission ID is required');
        const submission = await this.submissions.findById(id);
        return submission ? this.toProto(submission) : null;
    }

    async getUserSubmissions(userId: string, page: number, limit: number) {
        if (!userId) throw new Error('User ID is required');
        const result = await this.submissions.findByUserId(userId, page || 1, limit || 10);
        return {
            submissions: result.submissions.map((s) => this.toProto(s)),
            total: result.total,
            page: page || 1,
            limit: limit || 10,
        };
    }

    // ─── Update Status ────────────────────────────────────────────────

    async updateStatus(id: string, status: string, executionTime: number, memoryUsed: number) {
        if (id.startsWith('test-')) {
            this.logger.log(`🧪 Ignored DB update for test run: ${id} -> ${status}`);
            return { id, status, execution_time: executionTime, memory_used: memoryUsed };
        }

        const updated = await this.submissions.updateStatus(id, status, executionTime, memoryUsed);
        if (!updated) return null;

        const result = this.toProto(updated);

        // Publish result to Redis Pub/Sub — all gateway replicas listen on coderly:result:*
        // Each replica delivers the event only if it holds a local socket for this user.
        try {
            const channel = `coderly:result:${result.user_id}`;
            await this.publisher.publish(channel, JSON.stringify(result));
            this.logger.debug(`📢 Published result to ${channel}`);
        } catch (err) {
            this.logger.warn(`Failed to publish result for ${id}: ${(err as Error).message}`);
        }

        return result;
    }

    // ─── Helper ───────────────────────────────────────────────────────

    private toProto(s: Submission) {
        return {
            id: s.id,
            user_id: s.user_id,
            problem_id: s.problem_id,
            language: s.language,
            code_body: s.code_body,
            status: s.status,
            execution_time: s.execution_time || 0,
            memory_used: s.memory_used || 0,
            created_at: s.created_at?.toISOString() || '',
        };
    }
}
