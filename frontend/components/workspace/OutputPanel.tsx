'use client';
import { useRef, useEffect } from 'react';
import { Terminal, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface LogEntry { type: string; payload: string; }

interface Props {
    logs: LogEntry[];
    status: string;
    isRunning: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    accepted: { label: 'Accepted', color: 'var(--success)', icon: CheckCircle2 },
    wrong_answer: { label: 'Wrong Answer', color: 'var(--error)', icon: XCircle },
    time_limit_exceeded: { label: 'Time Limit Exceeded', color: 'var(--warning)', icon: Clock },
    runtime_error: { label: 'Runtime Error', color: 'var(--error)', icon: AlertTriangle },
    compile_error: { label: 'Compile Error', color: 'var(--error)', icon: AlertTriangle },
    pending: { label: 'Running…', color: 'var(--brand-300)', icon: Terminal },
    running: { label: 'Executing…', color: 'var(--brand-300)', icon: Terminal },
};

export function OutputPanel({ logs, status, isRunning }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const cfg = status ? STATUS_CONFIG[status] : null;
    const StatusIcon = cfg?.icon ?? Terminal;

    return (
        <div className="h-full flex flex-col" style={{ background: '#0a0015' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-subtle)] flex-shrink-0">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Terminal size={13} />
                    <span>Output</span>
                </div>
                {cfg && (
                    <div className="flex items-center gap-1.5">
                        {isRunning && <span className="w-2 h-2 rounded-full bg-[var(--brand-400)] animate-pulse" />}
                        <StatusIcon size={13} style={{ color: cfg.color }} />
                        <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                )}
            </div>

            {/* Log output */}
            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed">
                {logs.length === 0 && !isRunning ? (
                    <p className="text-[var(--text-muted)]">
                        Press <span className="text-[var(--success)]">Run</span> to test or <span className="text-[var(--brand-300)]">Submit</span> to evaluate.
                    </p>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className={
                            log.type === 'stderr' ? 'text-[var(--error)]'
                                : log.type === 'system' ? 'text-[var(--brand-300)]'
                                    : 'text-[var(--text-primary)]'
                        }>
                            {log.payload}
                        </div>
                    ))
                )}
                {isRunning && (
                    <div className="flex items-center gap-2 text-[var(--brand-300)] mt-2">
                        <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                        <span>Running…</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
