'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { logoutAction } from '@/app/actions/auth';
import { Code2, BookOpen, User, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
    const { isAuthenticated, username } = useSelector((s: RootState) => s.auth);
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { href: '/problems', label: 'Problems', icon: BookOpen },
    ];

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <header className="sticky top-0 z-50 glass border-b border-[var(--border-subtle)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-400)] to-[var(--brand-600)] flex items-center justify-center glow-sm group-hover:glow transition-all">
                        <Code2 size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-lg gradient-text tracking-tight">Coderly</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(href)
                                    ? 'bg-[var(--brand-800)] text-[var(--brand-300)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                                }`}
                        >
                            <Icon size={15} />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <Link
                                href="/profile"
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/profile')
                                        ? 'bg-[var(--brand-800)] text-[var(--brand-300)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                                    }`}
                            >
                                <User size={15} />
                                <span className="max-w-[120px] truncate">{username}</span>
                            </Link>
                            <form action={logoutAction}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] transition-all"
                                >
                                    <LogOut size={15} />
                                    Logout
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-all">
                                Sign in
                            </Link>
                            <Link
                                href="/register"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand-500)] hover:bg-[var(--brand-400)] text-white transition-all glow-sm"
                            >
                                <LogIn size={15} />
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                    onClick={() => setMobileOpen(o => !o)}
                >
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[var(--border-subtle)] px-4 py-4 flex flex-col gap-2">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)]">
                            <Icon size={15} />{label}
                        </Link>
                    ))}
                    {isAuthenticated ? (
                        <>
                            <Link href="/profile" onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)]">
                                <User size={15} />{username}
                            </Link>
                            <form action={logoutAction}><button type="submit" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)]"><LogOut size={15} />Logout</button></form>
                        </>
                    ) : (
                        <div className="flex gap-2 pt-2">
                            <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-3 py-2 rounded-lg text-sm border border-[var(--border)] text-[var(--text-secondary)]">Sign in</Link>
                            <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-3 py-2 rounded-lg text-sm bg-[var(--brand-500)] text-white">Get Started</Link>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
