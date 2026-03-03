'use client';
import { useMemo } from 'react';
import type { Submission } from '@/types';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Activity, Trophy, Target } from 'lucide-react';

interface Props {
    username: string;
    userId: string;
    submissions: Submission[];
    total: number;
    token: string;
}

const STATUS_COLOR: Record<string, string> = {
    accepted: 'var(--success)',
    wrong_answer: 'var(--error)',
    time_limit_exceeded: 'var(--warning)',
    runtime_error: 'var(--error)',
    compile_error: 'var(--error)',
    pending: 'var(--brand-300)',
    running: 'var(--brand-300)',
};

const STATUS_LABELS: Record<string, string> = {
    accepted: 'Accepted', wrong_answer: 'Wrong Answer',
    time_limit_exceeded: 'TLE', runtime_error: 'Runtime Error',
    compile_error: 'Compile Error', pending: 'Pending', running: 'Running',
};

function StatusBadge({ status }: { status: string }) {
    const Icon = status === 'accepted' ? CheckCircle2
        : status === 'time_limit_exceeded' ? Clock
            : status.includes('error') || status === 'wrong_answer' ? XCircle
                : AlertTriangle;
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: STATUS_COLOR[status] ?? 'var(--text-muted)' }}>
            <Icon size={11} />
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

export function ProfileClient({ username, userId, submissions, total }: Props) {
    const stats = useMemo(() => {
        const accepted = submissions.filter(s => s.status === 'accepted');
        const uniqueSolved = new Set(accepted.map(s => s.problem_id)).size;
        const attempted = new Set(submissions.map(s => s.problem_id)).size;
        return { total, uniqueSolved, attempted, acceptanceRate: submissions.length ? Math.round(accepted.length / submissions.length * 100) : 0 };
    }, [submissions, total]);

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center text-2xl font-black text-white glow">
                    {username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                    <h1 className="text-2xl font-black text-[var(--text-primary)]">{username}</h1>
                    <p className="text-sm text-[var(--text-muted)]">Coderly member</p>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Problems Solved', value: stats.uniqueSolved, icon: Trophy, color: 'var(--success)' },
                    { label: 'Attempted', value: stats.attempted, icon: Target, color: 'var(--brand-400)' },
                    { label: 'Total Submissions', value: stats.total, icon: Activity, color: 'var(--brand-300)' },
                    { label: 'Acceptance Rate', value: `${stats.acceptanceRate}%`, icon: CheckCircle2, color: 'var(--warning)' },
                ].map((s, i) => (
                    <div key={i} className="glass rounded-2xl p-5 border border-[var(--border-subtle)]">
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon size={15} style={{ color: s.color }} />
                            <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
                        </div>
                        <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Submission history */}
            <div className="glass rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
                    <h2 className="font-bold text-[var(--text-primary)]">Recent Submissions</h2>
                </div>
                {submissions.length === 0 ? (
                    <div className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">
                        No submissions yet. Go solve something! →{' '}
                        <a href="/problems" className="text-[var(--brand-300)] hover:underline">Browse problems</a>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--border-subtle)]">
                                    {['Problem ID', 'Language', 'Status', 'Time (ms)', 'Submitted'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[var(--text-muted)]">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(s => (
                                    <tr key={s.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
                                        <td className="px-5 py-3">
                                            <a href={`/problems/${s.problem_id}`} className="text-xs font-mono text-[var(--brand-300)] hover:text-[var(--brand-200)] truncate block max-w-[120px]">
                                                {s.problem_id.slice(0, 12)}…
                                            </a>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-card)] px-2 py-0.5 rounded">{s.language}</span>
                                        </td>
                                        <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                                        <td className="px-5 py-3 text-xs text-[var(--text-secondary)] font-mono">{s.execution_time ?? '—'}</td>
                                        <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                                            {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
