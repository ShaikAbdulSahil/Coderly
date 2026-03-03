import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { UserSession } from './interfaces/session.interface';

/**
 * SessionRepository — all SQL queries for the `user_sessions` table.
 * Manages login sessions and token versioning for JWT revocation.
 */
@Injectable()
export class SessionRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) { }

    /** Find the active session for a user */
    async findByUserId(userId: string): Promise<UserSession | null> {
        const { rows } = await this.pool.query(
            'SELECT * FROM user_sessions WHERE user_id = $1',
            [userId],
        );
        return rows[0] || null;
    }

    /** Create a new session when a user registers */
    async create(userId: string): Promise<UserSession> {
        const { rows } = await this.pool.query(
            `INSERT INTO user_sessions (user_id, token_version, last_login)
       VALUES ($1, 1, NOW())
       RETURNING *`,
            [userId],
        );
        return rows[0];
    }

    /** Bump the token version on login — this invalidates old JWTs */
    async bumpTokenVersion(userId: string, newVersion: number): Promise<UserSession | null> {
        const { rows } = await this.pool.query(
            `UPDATE user_sessions
       SET token_version = $1, last_login = NOW()
       WHERE user_id = $2
       RETURNING *`,
            [newVersion, userId],
        );
        return rows[0] || null;
    }
}
