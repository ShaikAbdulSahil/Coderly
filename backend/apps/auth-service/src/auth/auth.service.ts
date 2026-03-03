import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../users/user.repository';
import { SessionRepository } from '../sessions/session.repository';

/**
 * AuthService — core authentication logic.
 *
 * Delegates all DB work to repositories.
 * Handles password hashing, JWT creation, and token validation.
 */
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly SALT_ROUNDS = 12;

    constructor(
        private readonly users: UserRepository,
        private readonly sessions: SessionRepository,
        private readonly jwt: JwtService,
    ) { }

    // ─── Register ────────────────────────────────────────────────────

    async register(username: string, email: string, password: string) {
        // Guard: duplicate email
        const emailTaken = await this.users.findByEmail(email);
        if (emailTaken) {
            return { success: false, message: 'Email is already registered', userId: '' };
        }

        // Guard: duplicate username
        const usernameTaken = await this.users.findByUsername(username);
        if (usernameTaken) {
            return { success: false, message: 'Username is already taken', userId: '' };
        }

        // Hash password and create user
        const hash = await bcrypt.hash(password, this.SALT_ROUNDS);
        const user = await this.users.create(username, email, hash);

        // Create an initial session record
        await this.sessions.create(user.id);

        this.logger.log(`✅ New user registered: ${username} (${user.id})`);
        return { success: true, message: 'Registration successful', userId: user.id };
    }

    // ─── Login ───────────────────────────────────────────────────────

    async login(email: string, password: string) {
        const FAIL = {
            success: false,
            message: 'Invalid email or password',
            accessToken: '',
            userId: '',
            username: '',
        };

        // Step 1: Find user by email
        const user = await this.users.findByEmail(email);
        if (!user) return FAIL;

        // Step 2: Compare passwords
        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) return FAIL;

        // Step 3: Bump session token version (invalidates old JWTs)
        let session = await this.sessions.findByUserId(user.id);
        if (session) {
            session = await this.sessions.bumpTokenVersion(user.id, session.token_version + 1);
        } else {
            session = await this.sessions.create(user.id);
        }

        // Step 4: Sign a new JWT
        const accessToken = this.jwt.sign({
            sub: user.id,
            username: user.username,
            tokenVersion: session!.token_version,
        });

        this.logger.log(`✅ User logged in: ${user.username}`);
        return {
            success: true,
            message: 'Login successful',
            accessToken,
            userId: user.id,
            username: user.username,
        };
    }

    // ─── Validate Token ──────────────────────────────────────────────

    async validateToken(token: string) {
        const INVALID = { valid: false, userId: '', username: '' };

        try {
            // Step 1: Verify JWT signature and expiration
            const decoded = this.jwt.verify(token);

            // Step 2: Make sure the user still exists
            const user = await this.users.findById(decoded.sub);
            if (!user) return INVALID;

            // Step 3: Check token version (catches revoked tokens)
            const session = await this.sessions.findByUserId(decoded.sub);
            if (!session || session.token_version !== decoded.tokenVersion) {
                return INVALID;
            }

            return { valid: true, userId: user.id, username: user.username };
        } catch (err) {
            this.logger.warn(`Token validation failed: ${(err as Error).message}`);
            return INVALID;
        }
    }
}
