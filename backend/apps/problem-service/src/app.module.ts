import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProblemsModule } from './problems/problems.module';

/**
 * AppModule — root module for the Problem Service.
 * Connects to MongoDB and imports the problems feature module.
 */
@Module({
    imports: [
        ConfigModule.forRoot({ envFilePath: ['.env'], isGlobal: true }),
        MongooseModule.forRoot(
            process.env.MONGO_URI || 'mongodb://localhost:27017/coderly_problems',
        ),
        ProblemsModule,
    ],
})
export class AppModule { }
