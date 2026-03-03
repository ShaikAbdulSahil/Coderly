import {
    Controller, Get, Post, Put, Delete,
    Param, Query, Body, Headers, Res,
    HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ProblemService } from './problem.service';
import { CreateProblemDto, UpdateProblemDto } from './dto/problem.dto';

/**
 * ProblemsController — REST endpoints for coding challenges.
 *
 * GET    /api/problems              →  List (filter & paginate)      [Cache-Control: 90s]
 * GET    /api/problems/by-slug/:slug → Get by slug                  [ETag + 304 support]
 * GET    /api/problems/:id          →  Get by ID                    [ETag + 304 support]
 * POST   /api/problems              →  Create new                   [invalidates cache]
 * PUT    /api/problems/:id          →  Update existing              [invalidates cache]
 * DELETE /api/problems/:id          →  Delete                       [invalidates cache]
 */
@Controller('problems')
export class ProblemsController {
    private readonly logger = new Logger(ProblemsController.name);

    constructor(private readonly problemService: ProblemService) { }

    @Get()
    async list(
        @Query('category') category?: string,
        @Query('difficulty') difficulty?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Res() res?: Response,
    ) {
        try {
            const result = await this.problemService.getList(
                category || '', difficulty || '',
                parseInt(page || '1', 10), parseInt(limit || '10', 10),
            );
            res.setHeader('Cache-Control', 'public, max-age=90');
            return res.json(result);
        } catch (err) {
            this.logger.error(`List problems: ${(err as Error).message}`);
            throw new HttpException('Failed to fetch problems', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** GET by slug — before GET by :id so route doesn't shadow it */
    @Get('by-slug/:slug')
    async getBySlug(
        @Param('slug') slug: string,
        @Headers('if-none-match') ifNoneMatch: string,
        @Res() res: Response,
    ) {
        try {
            const { data, etag } = await this.problemService.getBySlug(slug);
            return this.sendWithEtag(res, data, etag, ifNoneMatch);
        } catch (err: any) {
            if (err?.code === 5 || err?.message?.includes('not found')) {
                throw new HttpException(`Problem "${slug}" not found`, HttpStatus.NOT_FOUND);
            }
            this.logger.error(`Get problem by slug: ${(err as Error).message}`);
            throw new HttpException('Failed to fetch problem', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get(':id')
    async getById(
        @Param('id') id: string,
        @Headers('if-none-match') ifNoneMatch: string,
        @Res() res: Response,
    ) {
        try {
            const { data, etag } = await this.problemService.getById(id);
            return this.sendWithEtag(res, data, etag, ifNoneMatch);
        } catch (err: any) {
            if (err?.code === 5 || err?.message?.includes('not found')) {
                throw new HttpException(`Problem "${id}" not found`, HttpStatus.NOT_FOUND);
            }
            this.logger.error(`Get problem: ${(err as Error).message}`);
            throw new HttpException('Failed to fetch problem', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post()
    async create(@Body() dto: CreateProblemDto) {
        try {
            return await this.problemService.create({
                title: dto.title, slug: dto.slug, difficulty: dto.difficulty,
                category: dto.category, description: dto.description,
                templates: dto.templates || [], test_cases: dto.test_cases || [],
                constraints: dto.constraints || [],
            });
        } catch (err: any) {
            if (err?.code === 6 || err?.message?.includes('already exists')) {
                throw new HttpException(err.message || err.details, HttpStatus.CONFLICT);
            }
            this.logger.error(`Create problem: ${(err as Error).message}`);
            throw new HttpException('Failed to create problem', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateProblemDto) {
        try {
            return await this.problemService.update(id, {
                title: dto.title || '', slug: dto.slug || '', difficulty: dto.difficulty || '',
                category: dto.category || '', description: dto.description || '',
                templates: dto.templates || [], test_cases: dto.test_cases || [],
                constraints: dto.constraints || [],
            });
        } catch (err: any) {
            if (err?.code === 5) throw new HttpException(`Problem "${id}" not found`, HttpStatus.NOT_FOUND);
            this.logger.error(`Update problem: ${(err as Error).message}`);
            throw new HttpException('Failed to update problem', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        try {
            return await this.problemService.delete(id);
        } catch (err: any) {
            if (err?.code === 5) throw new HttpException(`Problem "${id}" not found`, HttpStatus.NOT_FOUND);
            this.logger.error(`Delete problem: ${(err as Error).message}`);
            throw new HttpException('Failed to delete problem', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ─── Helper ───────────────────────────────────────────────────────

    /**
     * Sends the response with proper ETag and Cache-Control headers.
     * Returns 304 Not Modified if the client's ETag matches the stored one.
     */
    private sendWithEtag(res: Response, data: any, etag: string, ifNoneMatch?: string): Response {
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=600'); // 10 min browser cache

        if (ifNoneMatch && ifNoneMatch === etag) {
            return res.status(HttpStatus.NOT_MODIFIED).send();
        }
        return res.json(data);
    }
}
