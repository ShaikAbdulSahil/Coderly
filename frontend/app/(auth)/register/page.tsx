'use client';
import { useState } from 'react';
import { registerAction } from '@/app/actions/auth';
import Link from 'next/link';
import { Code2, Mail, Lock, User as UserIcon, UserPlus, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const fd = new FormData(e.currentTarget);
        const result = await registerAction(fd);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)' }}>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center glow">
                            <Code2 size={22} className="text-white" />
                        </div>
                        <span className="font-bold text-2xl gradient-text">Coderly</span>
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Start your journey</h1>
                    <p className="text-[var(--text-secondary)] mt-1 text-sm">Build confidence, one problem at a time</p>
                </div>

                <div className="glass rounded-2xl p-8 glow">
                    {error && (
                        <div className="mb-5 flex items-center gap-2 bg-[var(--error-bg)] border border-[var(--error)] rounded-lg px-4 py-3 text-[var(--error)] text-sm">
                            <AlertCircle size={16} />{error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Username</label>
                            <div className="relative">
                                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input name="username" type="text" required minLength={3} placeholder="coolcoder"
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-500)] focus:outline-none transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input name="email" type="email" required placeholder="you@example.com"
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-500)] focus:outline-none transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password <span className="text-[var(--text-muted)]">(min 6 chars)</span></label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input name="password" type="password" required minLength={6} placeholder="••••••••"
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-500)] focus:outline-none transition-colors" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--brand-500)] hover:bg-[var(--brand-400)] text-white font-medium text-sm transition-all glow-sm disabled:opacity-60">
                            {loading ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <UserPlus size={16} />}
                            {loading ? 'Creating account…' : 'Create account'}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--brand-300)] hover:text-[var(--brand-200)] font-medium transition-colors">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
