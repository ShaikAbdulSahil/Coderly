/**
 * Problem Service — gRPC Microservice Entry Point
 * ════════════════════════════════════════════════════════════════════════════════
 * Manages the coding problem catalog with full CRUD operations.
 * 
 * Features:
 * - Multi-language code templates per problem
 * - Test case management for submission validation
 * - Category and difficulty filtering with pagination
 * - Flexible document schema for varied problem structures
 * 
 * Database: MongoDB (coderly_problems)
 * Why MongoDB: Schema flexibility for nested templates and test cases
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const grpcPort = process.env.PROBLEM_GRPC_PORT || '50052';

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'coderly',
            protoPath: join(__dirname, '../../../proto/coderly.proto'),
            url: `0.0.0.0:${grpcPort}`,
        },
    });

    await app.listen();
    console.log(`📚 Problem Service running on gRPC port ${grpcPort}`);
}

bootstrap();
