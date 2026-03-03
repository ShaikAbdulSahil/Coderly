import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { Submission } from './interfaces/submission.interface';

/**
 * SubmissionRepository — all SQL queries for the `submissions` table.
 * The single source of truth for submission data access.
 */
@Injectable()
export class SubmissionRepository {
    constructor(@Inject(PG_POOL) private readonly pool: Pool) { }

    /** Create a new submission with status = 'pending' */
    async create(
        userId: string,
        problemId: string,
        language: string,
        codeBody: string,
    ): Promise<Submission> {
        const { rows } = await this.pool.query(
            `INSERT INTO submissions (user_id, problem_id, language, code_body, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
            [userId, problemId, language, codeBody],
        );
        return rows[0];
    }

    /** Find a submission by UUID */
    async findById(id: string): Promise<Submission | null> {
        const { rows } = await this.pool.query(
            'SELECT * FROM submissions WHERE id = $1',
            [id],
        );
        return rows[0] || null;
    }

    /** Get all submissions for a user, paginated, newest first */
    async findByUserId(userId: string, page: number, limit: number) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(50, Math.max(1, limit));
        const offset = (safePage - 1) * safeLimit;

        const [data, count] = await Promise.all([
            this.pool.query(
                `SELECT * FROM submissions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
                [userId, safeLimit, offset],
            ),
            this.pool.query(
                'SELECT COUNT(*)::int AS total FROM submissions WHERE user_id = $1',
                [userId],
            ),
        ]);

        return { submissions: data.rows as Submission[], total: count.rows[0].total };
    }

    /** Update the status and performance metrics of a submission */
    async updateStatus(
        id: string,
        status: string,
        executionTime: number,
        memoryUsed: number,
    ): Promise<Submission | null> {
        const { rows } = await this.pool.query(
            `UPDATE submissions
       SET status = $1, execution_time = $2, memory_used = $3
       WHERE id = $4
       RETURNING *`,
            [status, executionTime, memoryUsed, id],
        );
        return rows[0] || null;
    }
}
