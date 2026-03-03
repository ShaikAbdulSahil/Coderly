import { Injectable, Logger } from '@nestjs/common';
import { LogFrame, ExecutionResult } from '../shared/interfaces/execution.interface';

/**
 * ExecutionStore — in-memory store for execution log frames.
 *
 * The BullMQ processor writes logs here as code runs.
 * The gRPC streaming controller reads them for real-time delivery to clients.
 *
 * NOTE: For multi-instance deployments, replace this with Redis Pub/Sub.
 */
@Injectable()
export class ExecutionStore {
    private readonly logger = new Logger(ExecutionStore.name);
    private readonly results = new Map<string, ExecutionResult>();

    /** Initialize tracking for a new job */
    initJob(jobId: string) {
        this.results.set(jobId, { logs: [], completed: false });
    }

    /** Append a log frame to a running job */
    addLog(jobId: string, log: LogFrame) {
        const result = this.results.get(jobId);
        if (result) result.logs.push(log);
    }

    /** Mark a job as completed */
    completeJob(jobId: string) {
        const result = this.results.get(jobId);
        if (result) result.completed = true;
    }

    /** Get the full execution result for a job */
    getResult(jobId: string): ExecutionResult | undefined {
        return this.results.get(jobId);
    }

    /** Clean up after streaming is done (delayed by 5 minutes) */
    scheduleCleanup(jobId: string) {
        setTimeout(() => {
            this.results.delete(jobId);
            this.logger.debug(`Cleaned up results for job ${jobId}`);
        }, 5 * 60 * 1000);
    }
}
