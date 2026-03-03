import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ValidateTokenDto } from './dto/auth.dto';

/**
 * AuthController — gRPC endpoints for the AuthService proto definition.
 *
 * Routes:
 *   Register       →  Create a new user account
 *   Login          →  Authenticate and receive a JWT
 *   ValidateToken  →  Check if a JWT is still valid
 */
@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @GrpcMethod('AuthService', 'Register')
    async register(data: RegisterDto) {
        const result = await this.authService.register(data.username, data.email, data.password);
        return {
            success: result.success,
            message: result.message,
            userId: result.userId,
        };
    }

    @GrpcMethod('AuthService', 'Login')
    async login(data: LoginDto) {
        const result = await this.authService.login(data.email, data.password);
        return {
            success: result.success,
            message: result.message,
            accessToken: result.accessToken,
            userId: result.userId,
            username: result.username,
        };
    }

    @GrpcMethod('AuthService', 'ValidateToken')
    async validateToken(data: ValidateTokenDto) {
        const result = await this.authService.validateToken(data.token);
        return {
            valid: result.valid,
            userId: result.userId,
            username: result.username,
        };
    }
}
