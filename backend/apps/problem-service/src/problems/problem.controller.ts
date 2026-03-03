import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { ProblemService } from './problem.service';
import { CreateProblemDto, UpdateProblemDto, ProblemFilterDto } from './dto/problem.dto';

/**
 * ProblemController — gRPC endpoints for the ProblemService proto.
 *
 * Routes:
 *   GetProblemById  →  Fetch a single problem
 *   GetProblems     →  List with filters & pagination
 *   CreateProblem   →  Add a new problem
 *   UpdateProblem   →  Partial update an existing problem
 *   DeleteProblem   →  Remove a problem
 */
@Controller()
export class ProblemController {
    private readonly logger = new Logger(ProblemController.name);

    constructor(private readonly problemService: ProblemService) { }

    @GrpcMethod('ProblemService', 'GetProblemById')
    async getProblemById(data: { id: string }) {
        if (!data.id) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'Problem ID is required' });
        }

        const problem = await this.problemService.getById(data.id);
        if (!problem) {
            throw new RpcException({ code: GrpcStatus.NOT_FOUND, message: `Problem "${data.id}" not found` });
        }

        return problem;
    }

    @GrpcMethod('ProblemService', 'GetProblemBySlug')
    async getProblemBySlug(data: { slug: string }) {
        if (!data.slug) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'Slug is required' });
        }

        const problem = await this.problemService.getBySlug(data.slug);
        if (!problem) {
            throw new RpcException({ code: GrpcStatus.NOT_FOUND, message: `Problem "${data.slug}" not found` });
        }

        return problem;
    }

    @GrpcMethod('ProblemService', 'GetProblems')
    async getProblems(data: ProblemFilterDto) {
        return this.problemService.getList(
            data.category || '',
            data.difficulty || '',
            data.page || 1,
            data.limit || 10,
        );
    }

    @GrpcMethod('ProblemService', 'CreateProblem')
    async createProblem(data: CreateProblemDto) {
        if (!data.title || !data.slug || !data.difficulty || !data.category) {
            throw new RpcException({
                code: GrpcStatus.INVALID_ARGUMENT,
                message: 'title, slug, difficulty, and category are required',
            });
        }

        try {
            return await this.problemService.create(data);
        } catch (err) {
            throw new RpcException({ code: GrpcStatus.ALREADY_EXISTS, message: (err as Error).message });
        }
    }

    @GrpcMethod('ProblemService', 'UpdateProblem')
    async updateProblem(data: UpdateProblemDto) {
        if (!data.id) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'Problem ID is required' });
        }

        const updated = await this.problemService.update(data.id, data);
        if (!updated) {
            throw new RpcException({ code: GrpcStatus.NOT_FOUND, message: `Problem "${data.id}" not found` });
        }

        return updated;
    }

    @GrpcMethod('ProblemService', 'DeleteProblem')
    async deleteProblem(data: { id: string }) {
        if (!data.id) {
            throw new RpcException({ code: GrpcStatus.INVALID_ARGUMENT, message: 'Problem ID is required' });
        }

        return this.problemService.delete(data.id);
    }
}
