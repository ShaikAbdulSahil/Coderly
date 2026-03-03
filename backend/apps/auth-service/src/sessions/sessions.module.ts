import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SessionRepository } from './session.repository';

/**
 * SessionsModule — encapsulates session data access.
 * Exports SessionRepository for use by AuthModule.
 */
@Module({
    imports: [DatabaseModule],
    providers: [SessionRepository],
    exports: [SessionRepository],
})
export class SessionsModule { }
