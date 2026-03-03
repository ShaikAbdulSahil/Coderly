import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { User } from './interfaces/user.interface';

/**
 * UserRepository — all SQL queries for the `users` table live here.
 * Nothing else in the app touches the DB for users — this is the single source of truth.
 */
@Injectable()
export class UserRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) { }

    /** Find a user by their UUID */
    async findById(id: string): Promise<User | null> {
        const { rows } = await this.pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id],
        );
        return rows[0] || null;
    }

    /** Find a user by their email address */
    async findByEmail(email: string): Promise<User | null> {
        const { rows } = await this.pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email],
        );
        return rows[0] || null;
    }

    /** Find a user by their username */
    async findByUsername(username: string): Promise<User | null> {
        const { rows } = await this.pool.query(
            'SELECT * FROM users WHERE username = $1',
            [username],
        );
        return rows[0] || null;
    }

    /** Create a new user and return the inserted row */
    async create(username: string, email: string, passwordHash: string): Promise<User> {
        const { rows } = await this.pool.query(
            `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [username, email, passwordHash],
        );
        return rows[0];
    }
}
