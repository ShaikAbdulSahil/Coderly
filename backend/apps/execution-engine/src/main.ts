/**
 * Execution Engine — gRPC Microservice Entry Point
 * ════════════════════════════════════════════════════════════════════════════════
 * The sandboxed code execution service. Processes jobs from BullMQ and
 * runs user code in isolated Docker containers.
 * 
 * Key Features:
 * - Sandboxed execution: network=none, memory caps, CPU limits
 * - Multi-language support: Python, JavaScript, TypeScript, Java, C, C++
 * - Real-time log streaming via gRPC server-side streaming
 * - Automatic fallback to local child_process in dev mode (no Docker)
 * - BullMQ job processing with retry and backoff strategies
 * 
 * Security:
 * - No network access inside containers
 * - Strict resource limits (memory, CPU, execution time)
 * - Ephemeral containers destroyed after each execution
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const grpcPort = process.env.EXECUTION_GRPC_PORT || '50054';

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.GRPC,
        options: {
            package: 'coderly',
            protoPath: join(__dirname, '../../../proto/coderly.proto'),
            url: `0.0.0.0:${grpcPort}`,
        },
    });

    await app.listen();
    console.log(`⚙️  Execution Engine running on gRPC port ${grpcPort}`);
}

bootstrap();
