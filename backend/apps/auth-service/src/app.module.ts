import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthFeatureModule } from './auth/auth.module';

/**
 * AppModule — root module for the Auth Service.
 * Simply loads environment config and imports the auth feature module.
 */
@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ['.env'], isGlobal: true }),
        AuthFeatureModule,
    ],
})
export class AppModule { }
