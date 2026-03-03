import {
    WebSocketGateway, WebSocketServer, SubscribeMessage,
    MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { Observable, firstValueFrom } from 'rxjs';
import { SocketSessionService } from '../shared/socket-session.service';
import { ResultSubscriberService, SERVER_ID } from './result-subscriber.service';

// gRPC client interfaces
interface ExecutionServiceGrpc {
    streamExecutionLogs(data: { jobId: string }): Observable<{ type: string; payload: string }>;
}
interface AuthServiceGrpc {
    validateToken(data: { token: string }): Observable<{ valid: boolean; user_id: string; username: string }>;
}

/**
 * ExecutionGateway — WebSocket gateway for real-time code execution logs.
 *
 * Client flow:
 *   1. Connect to /execution namespace with JWT in query or auth.
 *   2. Emit "execute:subscribe" with { submissionId } to stream execution logs.
 *   3. Receive "execution:log" events with { type, payload, submissionId }.
 *   4. Receive "execution:complete" when the stream is done.
 *   5. Receive "submission:result" when execution engine finishes and status is updated (pushed via Redis Pub/Sub).
 *
 * Scalability:
 *   - On connect, registers userId → { serverId, socketId } in Redis Hash via SocketSessionService.
 *   - ResultSubscriberService listens to Redis Pub/Sub and delivers results to the local socket.
 *   - If the user is on a different replica, that replica handles delivery — this one ignores.
 */
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/execution' })
export class ExecutionGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(ExecutionGateway.name);

    private executionGrpc: ExecutionServiceGrpc;
    private authGrpc: AuthServiceGrpc;

    constructor(
        @Inject('EXECUTION_PACKAGE') private readonly execClient: ClientGrpc,
        @Inject('AUTH_PACKAGE') private readonly authClient: ClientGrpc,
        private readonly socketSession: SocketSessionService,
        private readonly resultSubscriber: ResultSubscriberService,
    ) { }

    onModuleInit() {
        this.executionGrpc = this.execClient.getService<ExecutionServiceGrpc>('ExecutionService');
        this.authGrpc = this.authClient.getService<AuthServiceGrpc>('AuthService');
        this.logger.log(`🚀 Gateway replica [${SERVER_ID.slice(0, 8)}] ready`);
    }

    // ─── Connection lifecycle ─────────────────────────────────────────

    async handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.query.token as string) ||
                client.handshake.auth?.token ||
                client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                client.emit('error', { message: 'Authentication required' });
                client.disconnect();
                return;
            }

            const result = await firstValueFrom(this.authGrpc.validateToken({ token }));
            if (!result.valid) {
                client.emit('error', { message: 'Invalid or expired token' });
                client.disconnect();
                return;
            }

            const userId = result.user_id;
            (client as any).user = { userId, username: result.username };

            // Register in Redis session registry (for cross-replica routing)
            await this.socketSession.register(userId, SERVER_ID, client.id);
            // Register in local in-process map (for this replica's Pub/Sub listener)
            this.resultSubscriber.addSocket(userId, client);

            this.logger.log(`🔌 ${result.username} connected (${client.id}) [server=${SERVER_ID.slice(0, 8)}]`);
        } catch (err) {
            this.logger.error(`WebSocket auth error: ${(err as Error).message}`);
            client.emit('error', { message: 'Authentication failed' });
            client.disconnect();
        }
    }

    async handleDisconnect(client: Socket) {
        const userId = (client as any).user?.userId;
        if (userId) {
            await this.socketSession.unregister(userId);
            this.resultSubscriber.removeSocket(userId);
        }
        this.logger.log(`🔌 Client disconnected (${client.id})`);
    }

    // ─── Subscribe to execution logs (streaming) ──────────────────────

    @SubscribeMessage('execute:subscribe')
    async handleSubscribe(
        @MessageBody() data: { submissionId: string },
        @ConnectedSocket() client: Socket,
    ) {
        if (!data.submissionId) {
            client.emit('error', { message: 'submissionId is required' });
            return;
        }

        this.logger.log(`📡 ${client.id} subscribing to ${data.submissionId}`);

        try {
            const stream = this.executionGrpc.streamExecutionLogs({ jobId: data.submissionId });

            stream.subscribe({
                next: (frame) => {
                    client.emit('execution:log', {
                        type: frame.type,
                        payload: frame.payload,
                        submissionId: data.submissionId,
                    });
                },
                error: (err) => {
                    this.logger.error(`Stream error ${data.submissionId}: ${err.message}`);
                    client.emit('execution:error', { submissionId: data.submissionId, message: 'Stream failed' });
                },
                complete: () => {
                    client.emit('execution:complete', { submissionId: data.submissionId });
                },
            });
        } catch (err) {
            this.logger.error(`Subscribe error: ${(err as Error).message}`);
            client.emit('execution:error', { submissionId: data.submissionId, message: 'Failed to subscribe' });
        }
    }
}
