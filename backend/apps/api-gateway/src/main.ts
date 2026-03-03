/**
 * API Gateway — Entry Point
 * ════════════════════════════════════════════════════════════════════════════════
 * The single entry point for all client traffic. Acts as a reverse proxy
 * that routes requests to the appropriate microservice.
 * 
 * Responsibilities:
 * - REST API endpoints (HTTP/JSON)
 * - WebSocket server for real-time execution logs (Socket.io)
 * - JWT validation and request authentication
 * - Redis caching layer for frequently accessed data
 * - Request validation via class-validator DTOs
 * 
 * Downstream gRPC connections:
 * - Auth Service (:50051)
 * - Problem Service (:50052)
 * - Submission Service (:50053)
 * - Execution Engine (:50054)
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const port = process.env.GATEWAY_PORT || 3000;
    const app = await NestFactory.create(AppModule);

    // CORS — tighten origin in production
    app.enableCors({ origin: '*', methods: 'GET,POST,PUT,PATCH,DELETE', credentials: true });

    // Auto-validate and transform request bodies using DTOs
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // All REST routes under /api
    app.setGlobalPrefix('api');

    await app.listen(port);
    console.log(`🚀 API Gateway running on http://localhost:${port}`);
}

bootstrap();
