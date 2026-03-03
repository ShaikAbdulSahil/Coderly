import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

/** gRPC client interface matching the SubmissionService proto */
interface SubmissionServiceGrpc {
    createSubmission(data: { user_id?: string; userId?: string; problem_id?: string; problemId?: string; language: string; code_body?: string; codeBody?: string; is_test_run?: boolean; isTestRun?: boolean }): Observable<any>;
    getSubmission(data: { id: string }): Observable<any>;
    getUserSubmissions(data: { user_id?: string; userId?: string; page: number; limit: number }): Observable<any>;
}

/**
 * SubmissionService (Gateway) — wraps gRPC calls to the Submission microservice.
 */
@Injectable()
export class SubmissionService implements OnModuleInit {
    private readonly logger = new Logger(SubmissionService.name);
    private grpc: SubmissionServiceGrpc;

    constructor(@Inject('SUBMISSION_PACKAGE') private readonly client: ClientGrpc) { }

    onModuleInit() {
        this.grpc = this.client.getService<SubmissionServiceGrpc>('SubmissionService');
    }

    async create(userId: string, problemId: string, language: string, codeBody: string, isTestRun = false) {
        return firstValueFrom(this.grpc.createSubmission({
            user_id: userId, userId,
            problem_id: problemId, problemId,
            language,
            code_body: codeBody, codeBody,
            is_test_run: isTestRun, isTestRun,
        }));
    }

    async getById(id: string) {
        return firstValueFrom(this.grpc.getSubmission({ id }));
    }

    async getByUser(userId: string, page: number, limit: number) {
        return firstValueFrom(this.grpc.getUserSubmissions({ user_id: userId, page, limit }));
    }
}
