'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { Problem } from '@/types';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Search, CheckCircle2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { api } from '@/lib/api';

const DIFF_COLOR: Record<string, string> = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' };
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const CATEGORIES = ['All', 'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Sliding Window', 'Two Pointers', 'Sorting', 'Hashing'];

interface Props {
    initialProblems: Problem[];
    total: number;
    initialPage: number;
    initialDifficulty: string;
    initialCategory: string;
}

export function ProblemListClient({ initialProblems, total, initialPage, initialDifficulty, initialCategory }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const { token } = useSelector((s: RootState) => s.auth);

    const [problems, setProblems] = useState(initialProblems);
    const [count, setCount] = useState(total);
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState(initialDifficulty);
    const [category, setCategory] = useState(initialCategory);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);

    // Solved IDs: stored in localStorage keyed by userId
    const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
    const { userId } = useSelector((s: RootState) => s.auth);

    useEffect(() => {
        if (!userId) return;
        try {
            const raw = localStorage.getItem(`coderly:solved:${userId}`);
            if (raw) setSolvedIds(new Set(JSON.parse(raw)));
        } catch { /* ignore */ }
    }, [userId]);

    const debouncedSearch = useDebounce(search, 350);

    const fetchProblems = useCallback(async (q: string, diff: string, cat: string, pg: number) => {
        setLoading(true);
        try {
            const params: any = { page: pg, limit: 20 };
            if (diff && diff !== 'All') params.difficulty = diff;
            if (cat && cat !== 'All') params.category = cat;
            const data = await api.problems.list(params, token ?? undefined);

            let filtered = data.problems;
            if (q) {
                const lower = q.toLowerCase();
                filtered = data.problems.filter(p =>
                    p.title.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower)
                );
            }
            setProblems(filtered);
            setCount(filtered.length > 0 ? data.total : 0);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProblems(debouncedSearch, difficulty, category, page);
    }, [debouncedSearch, difficulty, category, page, fetchProblems]);

    const totalPages = Math.ceil(count / 20);

    return (
        <div>
            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search problems…"
                        className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-500)] focus:outline-none transition-colors"
                    />
                </div>

                {/* Difficulty tabs */}
                <div className="flex gap-1 bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--border)]">
                    {DIFFICULTIES.map(d => (
                        <button key={d} onClick={() => { setDifficulty(d === 'All' ? '' : d); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${(d === 'All' ? !difficulty : difficulty === d)
                                    ? 'bg-[var(--brand-700)] text-[var(--brand-200)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}>
                            {d}
                        </button>
                    ))}
                </div>

                {/* Category select */}
                <select value={category || 'All'} onChange={e => { setCategory(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}
                    className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] focus:border-[var(--brand-500)] focus:outline-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-500)] border-t-transparent animate-spin" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-subtle)]">
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] w-8">#</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Problem</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] hidden md:table-cell">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Difficulty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] hidden sm:table-cell">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-[var(--text-muted)]">No problems found</td></tr>
                            ) : (
                                problems.map((p, i) => {
                                    const solved = solvedIds.has(p.id);
                                    return (
                                        <tr key={p.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors group">
                                            <td className="px-6 py-4 text-xs text-[var(--text-muted)]">{(page - 1) * 20 + i + 1}</td>
                                            <td className="px-6 py-4">
                                                <Link href={`/problems/${p.slug}`}
                                                    className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-300)] transition-colors text-sm">
                                                    {p.title}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-[var(--text-muted)] hidden md:table-cell">{p.category}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium" style={{ color: DIFF_COLOR[p.difficulty] }}>{p.difficulty}</span>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                {solved ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-[var(--success)]">
                                                        <CheckCircle2 size={12} /> Solved
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-[var(--text-muted)]">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-[var(--text-muted)]">{count} problems total</span>
                    <div className="flex gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40 hover:border-[var(--brand-500)] transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-2 text-xs text-[var(--text-muted)] font-mono">{page} / {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40 hover:border-[var(--brand-500)] transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
