import { Module } from '@nestjs/common';
import { ExecutionGateway } from './execution.gateway';
import { SocketSessionService } from '../shared/socket-session.service';
import { ResultSubscriberService } from './result-subscriber.service';

/**
 * ExecutionModule — WebSocket gateway for real-time code execution logs.
 *
 * Services:
 *   ExecutionGateway       — WebSocket namespace /execution with JWT auth
 *   SocketSessionService   — Redis Hash registry (userId → serverId + socketId)
 *   ResultSubscriberService — Redis Pub/Sub listener for cross-replica result delivery
 */
@Module({
    providers: [ExecutionGateway, SocketSessionService, ResultSubscriberService],
})
export class ExecutionModule { }
