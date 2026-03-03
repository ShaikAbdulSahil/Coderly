'use client';
import { useState, useActionState, Suspense } from 'react';
import { loginAction } from '@/app/actions/auth';
import Link from 'next/link';
import { Code2, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function LoginForm() {
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const next = searchParams.get('next') || '/problems';

    const [state, formAction] = useActionState(
        async (prevState: any, formData: FormData) => {
            setLoading(true);
            try {
                const result = await loginAction(formData);
                if (result.error) return { error: result.error };
                return { error: null };
            } finally {
                setLoading(false);
            }
        },
        { error: null }
    );

    return (
        <div className="min-h-screen pt-20 pb-12 flex flex-col items-center px-4">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-2 justify-center mb-10 group">
                    <div className="p-2 rounded-xl bg-[var(--brand-500)] text-white glow-sm group-hover:scale-110 transition-transform">
                        <Code2 size={24} />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">Coderly</span>
                </div>

                <div className="glass rounded-3xl p-8 border border-[var(--border-subtle)] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-400)] to-transparent opacity-50" />

                    <h1 className="text-2xl font-bold text-center mb-2 text-[var(--text-primary)]">Welcome back</h1>
                    <p className="text-sm text-center text-[var(--text-muted)] mb-8">Ready to keep building your momentum?</p>

                    <form action={formAction} className="space-y-5">
                        <input type="hidden" name="redirect" value={next} />

                        {state?.error && (
                            <div className="flex items-start gap-3 bg-[var(--error-bg)] border border-[var(--error)] p-4 rounded-2xl text-[var(--error)] text-sm animate-shake">
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <span>{state.error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] ml-1">Email or Username</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand-300)] transition-colors" size={18} />
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    placeholder="name@example.com"
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-500)]/10 transition-all placeholder:text-[var(--text-muted)]/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand-300)] transition-colors" size={18} />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-500)] focus:ring-4 focus:ring-[var(--brand-500)]/10 transition-all placeholder:text-[var(--text-muted)]/50"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[var(--brand-600)] to-[var(--brand-400)] text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-[var(--brand-500)]/20 hover:shadow-[var(--brand-500)]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-sm text-[var(--text-muted)]">
                        New to Coderly?{' '}
                        <Link href="/register" className="text-[var(--brand-300)] font-bold hover:text-[var(--brand-200)] transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--brand-300)]">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
