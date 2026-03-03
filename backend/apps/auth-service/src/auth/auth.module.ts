import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * AuthModule — the core feature module.
 * Imports UsersModule and SessionsModule for data access.
 * Registers the gRPC controller and auth business logic.
 */
@Module({
    imports: [
        UsersModule,
        SessionsModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'fallback-secret',
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthFeatureModule { }
