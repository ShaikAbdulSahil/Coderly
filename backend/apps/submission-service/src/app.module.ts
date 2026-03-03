import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { SubmissionsModule } from './submissions/submissions.module';

/**
 * AppModule — root module for the Submission Service.
 * Connects to Redis (for BullMQ) and imports the submissions feature module.
 */
@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ['.env'], isGlobal: true }),
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
                password: process.env.REDIS_PASSWORD || undefined,
            },
        }),
        SubmissionsModule,
    ],
})
export class AppModule { }
