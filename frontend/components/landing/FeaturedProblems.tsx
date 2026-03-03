import Link from 'next/link';
import type { Problem } from '@/types';
import { ArrowRight, CheckCircle } from 'lucide-react';

const DIFF_COLOR: Record<string, string> = {
    Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444',
};

export function FeaturedProblems({ problems }: { problems: Problem[] }) {
    if (problems.length === 0) return null;

    return (
        <section className="py-24 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <span className="inline-block px-3 py-1 rounded-full border border-[var(--brand-700)] bg-[var(--brand-900)] text-[var(--brand-300)] text-xs font-medium mb-3">Start here</span>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">Easy problems. <span className="gradient-text">Big confidence.</span></h2>
                    </div>
                    <Link href="/problems" className="hidden md:flex items-center gap-1 text-sm text-[var(--brand-300)] hover:text-[var(--brand-200)] font-medium transition-colors">
                        See all problems <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="glass rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-subtle)]">
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Problem</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] hidden md:table-cell">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Difficulty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((p, i) => (
                                <tr key={p.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors group">
                                    <td className="px-6 py-4">
                                        <Link href={`/problems/${p.slug}`} className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-300)] transition-colors text-sm">
                                            {i + 1}. {p.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-[var(--text-muted)] hidden md:table-cell">{p.category}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium" style={{ color: DIFF_COLOR[p.difficulty] }}>{p.difficulty}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-center md:hidden">
                    <Link href="/problems" className="inline-flex items-center gap-1 text-sm text-[var(--brand-300)] font-medium">
                        See all problems <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
