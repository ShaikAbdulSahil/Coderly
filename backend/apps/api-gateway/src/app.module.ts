import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GrpcClientsModule } from './shared/grpc/grpc-clients.module';
import { RedisCacheModule } from './shared/cache/redis-cache.module';
import { AuthModule } from './auth/auth.module';
import { ProblemsModule } from './problems/problems.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { ExecutionModule } from './execution/execution.module';

/**
 * AppModule — root module for the API Gateway.
 *
 * Architecture:
 *   shared/grpc    → gRPC clients for all internal services (global)
 *   shared/cache   → Redis cache service (global)
 *   auth/          → Authentication (register, login, JWT guard)
 *   problems/      → Problem CRUD with caching
 *   submissions/   → Code submissions
 *   execution/     → WebSocket real-time logs
 */
@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ['.env'], isGlobal: true }),
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 60,
        }]),
        GrpcClientsModule,
        RedisCacheModule,
        AuthModule,
        ProblemsModule,
        SubmissionsModule,
        ExecutionModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
