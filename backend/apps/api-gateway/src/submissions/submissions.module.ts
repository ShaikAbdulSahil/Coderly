import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionService } from './submission.service';

/**
 * SubmissionsModule (Gateway) — code submission management.
 * Imports AuthModule for the JWT guard used on all routes.
 */
@Module({
    imports: [AuthModule],
    controllers: [SubmissionsController],
    providers: [SubmissionService],
})
export class SubmissionsModule { }
