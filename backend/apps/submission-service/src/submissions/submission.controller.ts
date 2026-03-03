import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { SubmissionService } from './submission.service';
import { CreateSubmissionDto, UpdateStatusDto } from './dto/submission.dto';

/**
 * SubmissionController — gRPC endpoints for the SubmissionService proto.
 *
 * Routes:
 *   CreateSubmission         →  Save submission + queue job
 *   GetSubmission            →  Fetch by ID
 *   GetUserSubmissions       →  Paginated list for a user
 *   UpdateSubmissionStatus   →  Called by execution engine after run
 */
@Controller()
export class SubmissionController {
    private readonly logger = new Logger(SubmissionController.name);

    constructor(private readonly submissionService: SubmissionService) { }

    @GrpcMethod('SubmissionService', 'CreateSubmission')
    async createSubmission(data: CreateSubmissionDto) {
        try {
            return await this.submissionService.createSubmission(
                data.userId || data.user_id, data.problemId || data.problem_id, data.language, data.codeBody || data.code_body, data.isTestRun || data.is_test_run || false
            );
        } catch (err) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: (err as Error).message });
        }
    }

    @GrpcMethod('SubmissionService', 'GetSubmission')
    async getSubmission(data: { id: string }) {
        if (!data.id) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'Submission ID is required' });
        }
        const submission = await this.submissionService.getSubmission(data.id);
        if (!submission) {
            throw new RpcException({ code: GrpcStatus.NOT_FOUND, message: `Submission "${data.id}" not found` });
        }
        return submission;
    }

    @GrpcMethod('SubmissionService', 'GetUserSubmissions')
    async getUserSubmissions(data: { user_id: string; page: number; limit: number }) {
        if (!data.user_id) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'User ID is required' });
        }
        return this.submissionService.getUserSubmissions(data.user_id, data.page || 1, data.limit || 10);
    }

    @GrpcMethod('SubmissionService', 'UpdateSubmissionStatus')
    async updateSubmissionStatus(data: UpdateStatusDto) {
        if (!data.id || !data.status) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'ID and status are required' });
        }
        const updated = await this.submissionService.updateStatus(
            data.id, data.status, data.execution_time || 0, data.memory_used || 0,
        );
        if (!updated) {
            throw new RpcException({ code: GrpcStatus.NOT_FOUND, message: `Submission "${data.id}" not found` });
        }
        return updated;
    }
}
