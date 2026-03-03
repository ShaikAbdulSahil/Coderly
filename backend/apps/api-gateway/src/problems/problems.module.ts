import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemService } from './problem.service';

/**
 * ProblemsModule (Gateway) — problem browsing & management.
 * Includes Redis caching via RedisCacheService (global).
 */
@Module({
    controllers: [ProblemsController],
    providers: [ProblemService],
})
export class ProblemsModule { }
