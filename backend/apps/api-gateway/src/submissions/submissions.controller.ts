import {
    Controller, Get, Post, Param, Query, Body,
    UseGuards, Req, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SubmissionService } from './submission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSubmissionDto } from './dto/submission.dto';

/**
 * SubmissionsController — REST endpoints for code submissions.
 * All routes require JWT authentication.
 *
 * POST /api/submissions        →  Submit code (queues execution, global generous rate limit)
 * POST /api/submissions/run    →  Test code (queues execution, STRICT 10/day limit)
 * GET  /api/submissions/:id    →  Get submission by ID
 * GET  /api/submissions/user/me →  My submissions (paginated)
 */
@Controller('submissions')
export class SubmissionsController {
    private readonly logger = new Logger(SubmissionsController.name);

    constructor(private readonly submissionService: SubmissionService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body() dto: CreateSubmissionDto, @Req() req: any) {
        try {
            const result = await this.submissionService.create(
                req.user.userId, dto.problemId, dto.language, dto.codeBody, false
            );
            return { success: true, message: 'Submission queued for execution', submission: result };
        } catch (err: any) {
            if (err?.details) throw new HttpException(err.details, HttpStatus.BAD_REQUEST);
            this.logger.error(`Create submission: ${(err as Error).message}`);
            throw new HttpException('Failed to create submission', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('run')
    @UseGuards(JwtAuthGuard)
    @Throttle({ default: { limit: 10, ttl: 86400000 } }) // 10 requests per 24 hours (86400000 ms)
    async runTest(@Body() dto: CreateSubmissionDto, @Req() req: any) {
        try {
            const result = await this.submissionService.create(
                req.user.userId, dto.problemId, dto.language, dto.codeBody, true
            );
            return { success: true, message: 'Test Run queued for execution', submission: result };
        } catch (err: any) {
            if (err?.details) throw new HttpException(err.details, HttpStatus.BAD_REQUEST);
            this.logger.error(`Test run submission: ${(err as Error).message}`);
            throw new HttpException('Failed to create test run', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('user/me')
    @UseGuards(JwtAuthGuard)
    async mySubmissions(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
        try {
            return await this.submissionService.getByUser(
                req.user.userId, parseInt(page || '1', 10), parseInt(limit || '10', 10),
            );
        } catch (err) {
            this.logger.error(`My submissions: ${(err as Error).message}`);
            throw new HttpException('Failed to fetch submissions', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getById(@Param('id') id: string) {
        try {
            return await this.submissionService.getById(id);
        } catch (err: any) {
            if (err?.code === 5) throw new HttpException(`Submission "${id}" not found`, HttpStatus.NOT_FOUND);
            this.logger.error(`Get submission: ${(err as Error).message}`);
            throw new HttpException('Failed to fetch submission', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
