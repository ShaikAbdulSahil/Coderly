import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface SocketSession {
    serverId: string;
    socketId: string;
    connectedAt: string;
}

/**
 * SocketSessionService — Redis Hash registry mapping userId → { serverId, socketId }.
 *
 * This solves the WebSocket scaling problem: when the API Gateway is scaled to N replicas,
 * any service (e.g. SubmissionService) can publish a result event to Redis Pub/Sub and
 * each gateway replica checks its local socket map to find who should receive it.
 *
 * Key structure: Redis Hash `ws:sessions`
 *   Field: userId
 *   Value: JSON { serverId, socketId, connectedAt }
 *   TTL:   24 hours (auto-expired, refreshed on reconnect)
 */
@Injectable()
export class SocketSessionService implements OnModuleDestroy {
    private readonly logger = new Logger(SocketSessionService.name);
    private readonly client: Redis;
    private readonly HASH_KEY = 'ws:sessions';
    private readonly SESSION_TTL = 86400; // 24 hours in seconds

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => Math.min(times * 200, 3000),
        });

        this.client.on('connect', () => this.logger.log('✅ Socket session registry connected'));
        this.client.on('error', (err) => this.logger.error(`Socket session error: ${err.message}`));
    }

    /**
     * Register a connected WebSocket client in the Redis session registry.
     * Overwrites any existing session for this user (last-connect-wins).
     */
    async register(userId: string, serverId: string, socketId: string): Promise<void> {
        try {
            const session: SocketSession = { serverId, socketId, connectedAt: new Date().toISOString() };
            // Store user session and refresh hash TTL atomically
            await this.client
                .pipeline()
                .hset(this.HASH_KEY, userId, JSON.stringify(session))
                .expire(this.HASH_KEY, this.SESSION_TTL)
                .exec();
            this.logger.debug(`📝 Registered socket session: userId=${userId} socket=${socketId} server=${serverId}`);
        } catch (err) {
            this.logger.warn(`Failed to register socket session for ${userId}: ${(err as Error).message}`);
        }
    }

    /**
     * Unregister a disconnected WebSocket client from the registry.
     */
    async unregister(userId: string): Promise<void> {
        try {
            await this.client.hdel(this.HASH_KEY, userId);
            this.logger.debug(`🗑️ Unregistered socket session for userId=${userId}`);
        } catch (err) {
            this.logger.warn(`Failed to unregister socket session for ${userId}: ${(err as Error).message}`);
        }
    }

    /**
     * Look up which server + socket a user is connected to.
     * Returns null if the user has no active session.
     */
    async getSession(userId: string): Promise<SocketSession | null> {
        try {
            const raw = await this.client.hget(this.HASH_KEY, userId);
            return raw ? JSON.parse(raw) as SocketSession : null;
        } catch (err) {
            this.logger.warn(`Failed to get session for ${userId}: ${(err as Error).message}`);
            return null;
        }
    }

    async onModuleDestroy() {
        await this.client.quit();
    }
}
