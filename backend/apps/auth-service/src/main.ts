/**
 * Auth Service — gRPC Microservice Entry Point
 * ════════════════════════════════════════════════════════════════════════════════
 * Handles user authentication and session management.
 * 
 * Features:
 * - User registration with bcrypt password hashing (12 salt rounds)
 * - JWT-based authentication with configurable expiry
 * - Token validation for inter-service auth verification
 * - Session tracking with token version invalidation
 * 
 * Database: PostgreSQL (coderly_auth)
 * Security: Passwords never stored in plaintext
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const grpcPort = process.env.AUTH_GRPC_PORT || '50051';

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'coderly',
            protoPath: join(__dirname, '../../../proto/coderly.proto'),
            url: `0.0.0.0:${grpcPort}`,
        },
    });

    await app.listen();
    console.log(`🔐 Auth Service running on gRPC port ${grpcPort}`);
}

bootstrap();
