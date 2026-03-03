'use client';
import type { Problem } from '@/types';
import { useState } from 'react';
import { FileText, FlaskConical, CheckCircle2 } from 'lucide-react';

const DIFF_BADGE: Record<string, string> = {
    Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard',
};

interface Props {
    problem: Problem;
    isSolved: boolean;
}

export function ProblemPanel({ problem, isSolved }: Props) {
    const [tab, setTab] = useState<'description' | 'testcases'>('description');

    return (
        <div className="h-full flex flex-col overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            {/* Tabs */}
            <div className="flex border-b border-[var(--border-subtle)] flex-shrink-0">
                {(['description', 'testcases'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${tab === t ? 'border-[var(--brand-400)] text-[var(--brand-300)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }`}>
                        {t === 'description' ? <FileText size={13} /> : <FlaskConical size={13} />}
                        {t === 'description' ? 'Description' : 'Test Cases'}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
                {tab === 'description' ? (
                    <div>
                        {/* Solved banner */}
                        {isSolved && (
                            <div className="flex items-center gap-2 bg-[var(--success-bg)] border border-[var(--success)] rounded-xl px-4 py-3 mb-5 text-sm text-[var(--success)]">
                                <CheckCircle2 size={16} />
                                <span>You&apos;ve solved this problem! Feel free to revisit or try a different language.</span>
                            </div>
                        )}

                        {/* Title + difficulty */}
                        <div className="flex items-start gap-3 mb-4">
                            <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight flex-1">{problem.title}</h1>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${DIFF_BADGE[problem.difficulty]}`}>
                                {problem.difficulty}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] px-2.5 py-1 rounded-lg border border-[var(--border)]">{problem.category}</span>
                        </div>

                        {/* Description */}
                        <div className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap mb-8">
                            {problem.description}
                        </div>

                        {/* Constraints */}
                        {problem.constraints?.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3">Constraints</h3>
                                <ul className="space-y-1.5">
                                    {problem.constraints.map((c, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                                            <span className="text-[var(--brand-400)] mt-0.5">•</span>
                                            <code className="mono">{c}</code>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Example Test Cases</h3>
                        {problem.test_cases?.map((tc, i) => (
                            <div key={i} className="glass rounded-xl p-4 border border-[var(--border-subtle)]">
                                <div className="text-xs font-bold text-[var(--brand-300)] mb-3">Case {i + 1}</div>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Input</span>
                                        <code className="text-xs text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-2 rounded-lg block font-mono">{tc.input}</code>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Expected Output</span>
                                        <code className="text-xs text-[var(--success)] bg-[var(--success-bg)] px-3 py-2 rounded-lg block font-mono">{tc.expected}</code>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
