import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Problem, ProblemSchema } from './schemas/problem.schema';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';

/**
 * ProblemsModule — everything related to coding challenges.
 * Registers the Mongoose schema, service, and gRPC controller.
 */
@Module({
    imports: [
        MongooseModule.forFeature([{ name: Problem.name, schema: ProblemSchema }]),
    ],
    controllers: [ProblemController],
    providers: [ProblemService],
    exports: [ProblemService],
})
export class ProblemsModule { }
