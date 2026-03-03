import {
    CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

/**
 * JwtAuthGuard — protects routes by validating the JWT.
 *
 * How it works:
 *   1. Extract Bearer token from Authorization header
 *   2. Call Auth Service via gRPC to validate the token
 *   3. If valid, attach { userId, username } to request.user
 *   4. If invalid, throw UnauthorizedException
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private readonly authService: AuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Step 1: Extract token
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            throw new UnauthorizedException('No authorization header provided');
        }

        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            throw new UnauthorizedException('Invalid format. Use: Bearer <token>');
        }

        // Step 2: Validate via Auth Service
        try {
            const result = await this.authService.validateToken(token);

            if (!result.valid) {
                throw new UnauthorizedException('Invalid or expired token');
            }

            // Step 3: Attach user info to request
            request.user = { userId: result.userId || result.user_id, username: result.username };
            return true;

        } catch (err) {
            if (err instanceof UnauthorizedException) throw err;
            this.logger.error(`Token validation error: ${(err as Error).message}`);
            throw new UnauthorizedException('Authentication failed');
        }
    }
}
