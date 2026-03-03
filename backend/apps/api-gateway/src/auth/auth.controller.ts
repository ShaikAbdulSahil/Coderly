import {
    Controller, Post, Get, Body, UseGuards, Req,
    HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto } from './dto/auth.dto';

/**
 * AuthController — REST endpoints for authentication.
 *
 * POST /api/auth/register  →  Create account
 * POST /api/auth/login     →  Get JWT
 * GET  /api/auth/me        →  Current user info (protected)
 */
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        try {
            const result = await this.authService.register(dto.username, dto.email, dto.password);
            if (!result.success) throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
            return { success: true, message: result.message, userId: result.userId || result.user_id };
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(`Registration error: ${(err as Error).message}`);
            throw new HttpException('Registration failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        try {
            const result = await this.authService.login(dto.email, dto.password);
            if (!result.success) throw new HttpException(result.message, HttpStatus.UNAUTHORIZED);
            return {
                success: true,
                accessToken: result.accessToken || result.access_token,
                userId: result.userId || result.user_id,
                username: result.username,
            };
        } catch (err) {
            if (err instanceof HttpException) throw err;
            this.logger.error(`Login error: ${(err as Error).message}`);
            throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async me(@Req() req: any) {
        return { userId: req.user.userId, username: req.user.username };
    }
}
