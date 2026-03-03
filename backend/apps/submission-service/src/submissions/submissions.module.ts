import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../database/database.module';
import { SubmissionRepository } from './submission.repository';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';

/**
 * SubmissionsModule — everything related to code submissions.
 * Imports the DB pool and BullMQ queue, provides the repository, service, and controller.
 */
@Module({
    imports: [
        DatabaseModule,
        BullModule.registerQueue({ name: 'code-execution' }),
    ],
    controllers: [SubmissionController],
    providers: [SubmissionRepository, SubmissionService],
    exports: [SubmissionService],
})
export class SubmissionsModule { }
