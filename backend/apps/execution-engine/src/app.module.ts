import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionModule } from './execution/execution.module';

/**
 * AppModule — root module for the Execution Engine.
 * Sets up BullMQ (Redis) connection and imports the execution feature module.
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
        ExecutionModule,
    ],
})
export class AppModule { }
