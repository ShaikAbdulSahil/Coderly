/**
 * RunResult — what comes back after running user code.
 */
export interface RunResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
    executionTimeMs: number;
}

/**
 * LogFrame — a single log entry streamed to the client.
 * Matches the proto definition.
 */
export interface LogFrame {
    type: 'stdout' | 'stderr' | 'status' | 'result';
    payload: string;
}

/**
 * ExecutionResult — the full result of executing a submission.
 */
export interface ExecutionResult {
    logs: LogFrame[];
    completed: boolean;
}
