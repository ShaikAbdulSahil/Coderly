import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';

/** gRPC client interface matching the AuthService proto */
interface AuthServiceGrpc {
    register(data: { username: string; email: string; password: string }): Observable<{
        success: boolean; message: string; user_id?: string; userId?: string;
    }>;
    login(data: { email: string; password: string }): Observable<{
        success: boolean; message: string; access_token?: string; accessToken?: string; user_id?: string; userId?: string; username: string;
    }>;
    validateToken(data: { token: string }): Observable<{
        valid: boolean; user_id?: string; userId?: string; username: string;
    }>;
}

/**
 * AuthService (Gateway) — wraps gRPC calls to the Auth microservice.
 * Controllers call this service instead of touching gRPC directly.
 */
@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name);
    private grpc: AuthServiceGrpc;

    constructor(@Inject('AUTH_PACKAGE') private readonly client: ClientGrpc) { }

    onModuleInit() {
        this.grpc = this.client.getService<AuthServiceGrpc>('AuthService');
    }

    async register(username: string, email: string, password: string) {
        return firstValueFrom(this.grpc.register({ username, email, password }));
    }

    async login(email: string, password: string) {
        return firstValueFrom(this.grpc.login({ email, password }));
    }

    async validateToken(token: string) {
        return firstValueFrom(this.grpc.validateToken({ token }));
    }
}
