import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { Socket } from 'socket.io';

export const SERVER_ID = randomUUID(); // Unique ID per gateway process/replica

/**
 * ResultSubscriberService — listens to Redis Pub/Sub for submission result events
 * and delivers them to the correct local WebSocket client.
 *
 * Pattern:
 *   - Publisher: SubmissionService publishes to channel `coderly:result:{userId}`
 *   - Subscriber: Each gateway replica subscribes to `coderly:result:*`
 *   - Delivery: This service checks the local socket map; only the replica that
 *               holds the socket delivers the event.
 *
 * This enables horizontal scaling of the API Gateway with no additional coordination.
 */
@Injectable()
export class ResultSubscriberService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ResultSubscriberService.name);
    private readonly subscriber: Redis;

    /** Local in-memory map: userId → Socket (only for THIS replica) */
    private readonly localSockets = new Map<string, Socket>();

    constructor() {
        this.subscriber = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => Math.min(times * 200, 3000),
        });
    }

    async onModuleInit() {
        // Subscribe to all result channels (pattern subscription)
        await this.subscriber.psubscribe('coderly:result:*');
        this.logger.log(`📡 [${SERVER_ID.slice(0, 8)}] Subscribed to coderly:result:* Pub/Sub`);

        this.subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
            // Channel pattern: coderly:result:{userId}
            const userId = channel.replace('coderly:result:', '');
            const socket = this.localSockets.get(userId);

            if (!socket) {
                // This user is connected to a different replica — ignore
                return;
            }

            try {
                const payload = JSON.parse(message);
                socket.emit('submission:result', payload);
                this.logger.debug(`📨 Delivered result to ${userId} via socket ${socket.id}`);
            } catch (err) {
                this.logger.warn(`Failed to parse result for ${userId}: ${(err as Error).message}`);
            }
        });

        this.subscriber.on('error', (err) =>
            this.logger.error(`Result subscriber error: ${err.message}`));
    }

    /** Called by ExecutionGateway on client connect */
    addSocket(userId: string, socket: Socket): void {
        this.localSockets.set(userId, socket);
        this.logger.debug(`➕ Local socket registered: ${userId} → ${socket.id}`);
    }

    /** Called by ExecutionGateway on client disconnect */
    removeSocket(userId: string): void {
        this.localSockets.delete(userId);
        this.logger.debug(`➖ Local socket removed: ${userId}`);
    }

    async onModuleDestroy() {
        this.localSockets.clear();
        await this.subscriber.quit();
    }
}
