import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UserRepository } from './user.repository';

/**
 * UsersModule — encapsulates everything related to user data access.
 * Exports UserRepository so other modules (like AuthModule) can use it.
 */
@Module({
    imports: [DatabaseModule],
    providers: [UserRepository],
    exports: [UserRepository],
})
export class UsersModule { }
