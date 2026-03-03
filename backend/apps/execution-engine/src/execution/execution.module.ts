import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RunnerModule } from '../runner/runner.module';
import { ExecutionStore } from './execution.store';
import { ExecutionProcessor } from './execution.processor';
import { ExecutionController } from './execution.controller';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

/**
 * ExecutionModule — the core feature module.
 * Imports RunnerModule for code execution and provides the BullMQ processor + gRPC controller.
 */
@Module({
    imports: [
        RunnerModule,
        BullModule.registerQueue({ name: 'code-execution' }),
        ClientsModule.register([
            {
                name: 'SUBMISSION_PACKAGE',
                transport: Transport.GRPC,
                options: {
                    package: 'coderly',
                    protoPath: join(__dirname, '../../../../proto/coderly.proto'),
                    url: process.env.SUBMISSION_SERVICE_URL || 'coderly-submission:50053',
                },
            },
        ]),
    ],
    controllers: [ExecutionController],
    providers: [ExecutionStore, ExecutionProcessor],
})
export class ExecutionModule { }
