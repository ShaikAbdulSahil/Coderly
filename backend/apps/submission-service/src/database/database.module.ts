import { Module } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

@Module({
    providers: [
        {
            provide: PG_POOL,
            useFactory: () => {
                const pool = new Pool({
                    host: process.env.SUBMISSION_DB_HOST || 'localhost',
                    port: parseInt(process.env.SUBMISSION_DB_PORT || '5432', 10),
                    user: process.env.SUBMISSION_DB_USER || 'coderly',
                    password: process.env.SUBMISSION_DB_PASSWORD || '',
                    database: process.env.SUBMISSION_DB_NAME || 'coderly_submissions',
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                });

                pool.on('connect', () => {
                    console.log('📦 Submission DB: New client connected to pool');
                });

                pool.on('error', (err) => {
                    console.error('❌ Submission DB: Unexpected pool error', err.message);
                });

                return pool;
            },
        },
    ],
    exports: [PG_POOL],
})
export class DatabaseModule { }
