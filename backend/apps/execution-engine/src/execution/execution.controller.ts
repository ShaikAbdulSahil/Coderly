import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { ExecutionStore } from './execution.store';
import { LogFrame } from '../shared/interfaces/execution.interface';

/**
 * ExecutionController — gRPC server-side streaming endpoint.
 *
 * Proto: rpc StreamExecutionLogs (ExecutionJobId) returns (stream LogFrame);
 *
 * How it works:
 *   1. Gateway calls this with a submission ID
 *   2. We poll the ExecutionStore for new log frames
 *   3. Each frame is emitted to the stream
 *   4. When the job completes, the stream closes
 */
@Controller()
export class ExecutionController {
    private readonly logger = new Logger(ExecutionController.name);

    constructor(private readonly store: ExecutionStore) { }

    @GrpcMethod('ExecutionService', 'StreamExecutionLogs')
    streamExecutionLogs(data: { jobId: string }): Observable<LogFrame> {
        if (!data.jobId) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'job_id is required' });
        }

        this.logger.log(`📡 Client subscribed to logs for job: ${data.jobId}`);

        return new Observable<LogFrame>((subscriber) => {
            let cursor = 0;                     // tracks how many logs we've sent
            const POLL_MS = 200;                // check every 200ms
            const MAX_WAIT_MS = 60000;          // give up after 60s
            const startTime = Date.now();

            const poll = () => {
                // Timeout guard
                if (Date.now() - startTime > MAX_WAIT_MS) {
                    subscriber.next({ type: 'status', payload: 'Timed out waiting for execution results' });
                    subscriber.complete();
                    return;
                }

                const result = this.store.getResult(data.jobId);

                // Job hasn't started yet — keep waiting
                if (!result) {
                    setTimeout(poll, POLL_MS);
                    return;
                }

                // Send any new log frames since our last cursor position
                while (cursor < result.logs.length) {
                    subscriber.next(result.logs[cursor]);
                    cursor++;
                }

                // If job is done, close the stream
                if (result.completed) {
                    subscriber.complete();
                    return;
                }

                setTimeout(poll, POLL_MS);
            };

            poll();
        });
    }
}
