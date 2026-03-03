import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: { default: 'Coderly — Build Confidence. Solve Problems.', template: '%s | Coderly' },
    description: 'A beginner-friendly coding platform with curated problems designed to build your confidence before you tackle the big leagues.',
    keywords: ['coding', 'programming', 'beginner', 'algorithms', 'data structures', 'learn to code'],
    openGraph: {
        title: 'Coderly',
        description: 'We don\'t have 3,000 problems. We have the right problems.',
        type: 'website',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
