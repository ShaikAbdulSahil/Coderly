import { Module } from '@nestjs/common';
import { DockerRunnerService } from './docker-runner.service';

/**
 * RunnerModule — encapsulates the code execution runtime.
 * Exports DockerRunnerService for use by the execution processor.
 */
@Module({
    providers: [DockerRunnerService],
    exports: [DockerRunnerService],
})
export class RunnerModule { }
