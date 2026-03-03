import { Module } from '@nestjs/common';
import { Pool } from 'pg';

// A simple provider that creates a pg.Pool and shares it across the app.
// The pool automatically manages connections — no need for manual connect/release.

export const PG_POOL = 'PG_POOL';

@Module({
    providers: [
        {
            provide: PG_POOL,
            useFactory: () => {
                const pool = new Pool({
                    host: process.env.AUTH_DB_HOST || 'localhost',
                    port: parseInt(process.env.AUTH_DB_PORT || '5432', 10),
                    user: process.env.AUTH_DB_USER || 'coderly',
                    password: process.env.AUTH_DB_PASSWORD || '',
                    database: process.env.AUTH_DB_NAME || 'coderly_auth',
                    max: 20,                // max connections in the pool
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                });

                // Log connection status on startup
                pool.on('connect', () => {
                    console.log('📦 Auth DB: New client connected to pool');
                });

                pool.on('error', (err) => {
                    console.error('❌ Auth DB: Unexpected pool error', err.message);
                });

                return pool;
            },
        },
    ],
    exports: [PG_POOL],
})
export class DatabaseModule { }
