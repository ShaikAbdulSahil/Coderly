import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { RunResult } from '../shared/interfaces/execution.interface';

// ─── Language Config ────────────────────────────────────────────────

const DOCKER_IMAGES: Record<string, string> = {
    python: 'python:3.11-slim',
    javascript: 'node:20-slim',
    typescript: 'node:20-slim',
    java: 'openjdk:17-slim',
    cpp: 'gcc:13',
    c: 'gcc:13',
};

const FILE_EXTENSIONS: Record<string, string> = {
    python: '.py', javascript: '.js', typescript: '.ts',
    java: '.java', cpp: '.cpp', c: '.c',
};

/** Build the shell command to run code in each language */
function buildRunCommand(language: string, filepath: string): string[] {
    switch (language) {
        case 'python': return ['python3', filepath];
        case 'javascript': return ['node', filepath];
        case 'typescript': return ['npx', 'ts-node', filepath];
        case 'java': return ['sh', '-c', `javac ${filepath} && java ${filepath.replace('.java', '')}`];
        case 'cpp': return ['sh', '-c', `g++ -o /tmp/solution ${filepath} && /tmp/solution`];
        case 'c': return ['sh', '-c', `gcc -o /tmp/solution ${filepath} && /tmp/solution`];
        default: return ['echo', 'Unsupported language'];
    }
}

// ─── Docker Runner Service ──────────────────────────────────────────

/**
 * DockerRunnerService — runs user code in sandboxed environments.
 *
 * Strategy:
 *   - If Docker is available → run in a container (network=none, memory cap, CPU limit)
 *   - If Docker is NOT available → run locally via child_process (dev mode only)
 *
 * Both paths enforce a timeout and stream logs via the onLog callback.
 */
@Injectable()
export class DockerRunnerService {
    private readonly logger = new Logger(DockerRunnerService.name);
    private readonly timeoutMs: number;
    private readonly memoryLimitMb: number;
    private dockerAvailable: boolean | null = null;

    constructor() {
        this.timeoutMs = parseInt(process.env.EXECUTION_TIMEOUT_MS || '10000', 10);
        this.memoryLimitMb = parseInt(process.env.EXECUTION_MEMORY_LIMIT_MB || '256', 10);
    }

    /** Check once whether Docker is available on this machine */
    private async checkDocker(): Promise<boolean> {
        if (this.dockerAvailable !== null) return this.dockerAvailable;

        return new Promise((resolve) => {
            const proc = spawn('docker', ['version'], { timeout: 3000 });
            proc.on('close', (code) => {
                this.dockerAvailable = code === 0;
                if (!this.dockerAvailable) this.logger.warn('Docker not found — using local fallback');
                resolve(this.dockerAvailable);
            });
            proc.on('error', () => {
                this.dockerAvailable = false;
                this.logger.warn('Docker not found — using local fallback');
                resolve(false);
            });
        });
    }

    /** Run user code — automatically picks Docker or local */
    async run(language: string, code: string, onLog: (type: string, payload: string) => void): Promise<RunResult> {
        const useDocker = await this.checkDocker();
        return useDocker
            ? this.runInDocker(language, code, onLog)
            : this.runLocally(language, code, onLog);
    }

    // ─── Docker Execution ───────────────────────────────────────────

    private async runInDocker(language: string, code: string, onLog: (type: string, payload: string) => void): Promise<RunResult> {
        const image = DOCKER_IMAGES[language];
        if (!image) return { stdout: '', stderr: `Unsupported language: ${language}`, exitCode: 1, timedOut: false, executionTimeMs: 0 };

        const { tmpDir, filepath, filename } = this.writeTempFile(language, code);
        const containerName = `coderly-run-${path.basename(tmpDir)}`;
        const runCmd = buildRunCommand(language, `/app/${filename}`);

        onLog('status', `Running ${language} code in Docker container...`);

        const script = `
            docker create --name ${containerName} --network none --memory=${this.memoryLimitMb}m --cpus=0.5 -w /app ${image} ${runCmd.join(' ')} >/dev/null && \\
            docker cp ${filepath} ${containerName}:/app/${filename} && \\
            docker start -a ${containerName}
        `;

        return this.spawnAndCollect('sh', ['-c', script], tmpDir, onLog, containerName);
    }

    // ─── Local Execution (dev fallback) ─────────────────────────────

    private async runLocally(language: string, code: string, onLog: (type: string, payload: string) => void): Promise<RunResult> {
        const ext = FILE_EXTENSIONS[language];
        if (!ext) return { stdout: '', stderr: `Unsupported language: ${language}`, exitCode: 1, timedOut: false, executionTimeMs: 0 };

        const { tmpDir, filepath } = this.writeTempFile(language, code);
        const runCmd = buildRunCommand(language, filepath);

        onLog('status', `Running ${language} code locally (dev mode)...`);

        return this.spawnAndCollect(runCmd[0], runCmd.slice(1), tmpDir, onLog);
    }

    // ─── Helpers ────────────────────────────────────────────────────

    /** Create a temp directory and write the user's code to a file */
    private writeTempFile(language: string, code: string) {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coderly-'));
        const ext = FILE_EXTENSIONS[language];
        const filename = `solution${ext}`;
        const filepath = path.join(tmpDir, filename);
        fs.writeFileSync(filepath, code);
        return { tmpDir, filepath, filename };
    }

    /** Spawn a process, collect stdout/stderr, enforce timeout, clean up */
    private spawnAndCollect(
        cmd: string, args: string[], tmpDir: string, onLog: (type: string, payload: string) => void, containerName?: string
    ): Promise<RunResult> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let stdout = '', stderr = '', timedOut = false;

            const proc = spawn(cmd, args, { timeout: this.timeoutMs + 5000 });

            const timer = setTimeout(() => {
                timedOut = true;
                proc.kill('SIGKILL');
                onLog('stderr', `⏱️ Execution timed out after ${this.timeoutMs}ms`);
            }, this.timeoutMs);

            proc.stdout.on('data', (data: Buffer) => { const t = data.toString(); stdout += t; onLog('stdout', t); });
            proc.stderr.on('data', (data: Buffer) => { const t = data.toString(); stderr += t; onLog('stderr', t); });

            proc.on('close', (exitCode) => {
                clearTimeout(timer);
                this.cleanupTemp(tmpDir, containerName);
                resolve({ stdout, stderr, exitCode: exitCode ?? 1, timedOut, executionTimeMs: Date.now() - startTime });
            });

            proc.on('error', (err) => {
                clearTimeout(timer);
                stderr += err.message;
                onLog('stderr', `Process error: ${err.message}`);
                this.cleanupTemp(tmpDir, containerName);
                resolve({ stdout, stderr, exitCode: 1, timedOut: false, executionTimeMs: Date.now() - startTime });
            });
        });
    }

    private cleanupTemp(dir: string, containerName?: string) {
        if (containerName) {
            try { spawn('docker', ['rm', '-f', containerName]); } catch { /* ignore */ }
        }
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
    }
}
