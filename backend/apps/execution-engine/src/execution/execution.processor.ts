import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Job } from 'bullmq';
import { DockerRunnerService } from '../runner/docker-runner.service';
import { ExecutionStore } from './execution.store';

interface SubmissionServiceGrpc {
    updateSubmissionStatus(data: { id: string; status: string; execution_time?: number; executionTime?: number; memory_used?: number; memoryUsed?: number }): any;
}

/**
 * ExecutionProcessor — BullMQ worker that processes code execution jobs.
 *
 * Pipeline:
 *   1. Job arrives from Submission Service (via Redis)
 *   2. Initialize log tracking in ExecutionStore
 *   3. Run code via DockerRunnerService
 *   4. Stream log frames into the store as they arrive
 *   5. Write final status and mark job complete
 */
@Processor('code-execution')
export class ExecutionProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(ExecutionProcessor.name);
    private submissionGrpc: SubmissionServiceGrpc;

    constructor(
        private readonly runner: DockerRunnerService,
        private readonly store: ExecutionStore,
        @Inject('SUBMISSION_PACKAGE') private readonly client: ClientGrpc,
    ) {
        super();
    }

    onModuleInit() {
        this.submissionGrpc = this.client.getService<SubmissionServiceGrpc>('SubmissionService');
    }

    async process(job: Job<{
        submissionId: string;
        userId: string;
        problemId: string;
        language: string;
        codeBody: string;
    }>): Promise<void> {
        const { submissionId, language, codeBody } = job.data;
        this.logger.log(`⚙️ Processing job ${submissionId} (${language})`);

        // Step 1: Initialize result tracking
        this.store.initJob(submissionId);
        this.store.addLog(submissionId, { type: 'status', payload: 'Compiling and running...' });

        try {
            // Step 2: Execute the code (logs stream into store via callback)
            const result = await this.runner.run(language, codeBody, (type, payload) => {
                this.store.addLog(submissionId, { type: type as any, payload });
            });
            this.logger.log(`[Runner Output] STDOUT: ${result.stdout} | STDERR: ${result.stderr}`);

            // Step 3: Determine final status
            let finalStatus: string;
            if (result.timedOut) {
                finalStatus = 'error';
                this.store.addLog(submissionId, {
                    type: 'result',
                    payload: JSON.stringify({ status: 'error', reason: 'Time Limit Exceeded', executionTimeMs: result.executionTimeMs }),
                });
            } else if (result.exitCode !== 0) {
                finalStatus = 'error';
                this.store.addLog(submissionId, {
                    type: 'result',
                    payload: JSON.stringify({ status: 'error', reason: 'Runtime Error', exitCode: result.exitCode, executionTimeMs: result.executionTimeMs }),
                });
            } else {
                finalStatus = 'accepted';
                this.store.addLog(submissionId, {
                    type: 'result',
                    payload: JSON.stringify({ status: 'accepted', executionTimeMs: result.executionTimeMs }),
                });
            }

            // Step 4: Done
            this.store.completeJob(submissionId);
            this.store.scheduleCleanup(submissionId);
            this.logger.log(`✅ Job ${submissionId} — ${finalStatus} (${result.executionTimeMs}ms)`);
            try {
                await firstValueFrom(this.submissionGrpc.updateSubmissionStatus({
                    id: submissionId,
                    status: finalStatus,
                    execution_time: result.executionTimeMs,
                    executionTime: result.executionTimeMs,
                    memory_used: 0,
                    memoryUsed: 0,
                }));
            } catch (e: any) {
                this.logger.error(`Failed to push status to submission service: ${e.message}`);
            }

        } catch (err) {
            this.logger.error(`❌ Job ${submissionId} failed: ${(err as Error).message}`);
            this.store.addLog(submissionId, {
                type: 'result',
                payload: JSON.stringify({ status: 'error', reason: 'Internal execution error' }),
            });
            this.store.completeJob(submissionId);
            this.store.scheduleCleanup(submissionId);
            try {
                await firstValueFrom(this.submissionGrpc.updateSubmissionStatus({
                    id: submissionId,
                    status: 'error',
                    execution_time: 0,
                    executionTime: 0,
                    memory_used: 0,
                    memoryUsed: 0,
                }));
            } catch (e: any) { }
        }
    }
}
