import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign In' };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>{children}</div>;
}
