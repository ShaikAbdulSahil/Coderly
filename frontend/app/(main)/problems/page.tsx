import { serverFetch } from '@/lib/api';
import type { ProblemListResponse } from '@/types';
import { ProblemListClient } from '@/components/problems/ProblemListClient';
import type { Metadata } from 'next';

export const revalidate = 90;

export const metadata: Metadata = {
    title: 'Problems — Build Your Foundation',
    description: 'Browse curated coding problems organized by difficulty and category. Start Easy, build confidence, conquer Medium.',
};

interface Props {
    searchParams: Promise<{ difficulty?: string; category?: string; page?: string; q?: string }>;
}

export default async function ProblemsPage({ searchParams }: Props) {
    const sp = await searchParams;
    const page = parseInt(sp.page || '1', 10);
    const difficulty = sp.difficulty || '';
    const category = sp.category || '';

    const params = new URLSearchParams();
    if (difficulty) params.set('difficulty', difficulty);
    if (category) params.set('category', category);
    params.set('page', String(page));
    params.set('limit', '20');

    const data = await serverFetch<ProblemListResponse>(`/problems?${params}`);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[var(--text-primary)]">Problems</h1>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">
                    {data?.total ?? 0} problems curated for your journey
                </p>
            </div>
            <ProblemListClient
                initialProblems={data?.problems ?? []}
                total={data?.total ?? 0}
                initialPage={page}
                initialDifficulty={difficulty}
                initialCategory={category}
            />
        </div>
    );
}
