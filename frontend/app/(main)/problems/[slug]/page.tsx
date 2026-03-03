import { serverFetch } from '@/lib/api';
import type { Problem } from '@/types';
import { WorkspaceClient } from '@/components/workspace/WorkspaceClient';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const problem = await serverFetch<Problem>(`/problems/by-slug/${slug}`);
    return { title: problem ? `${problem.title} — Coderly` : 'Problem' };
}

export default async function ProblemPage({ params }: Props) {
    const { slug } = await params;
    const jar = await cookies();
    const token = jar.get('coderly_token')?.value;

    const problem = await serverFetch<Problem>(`/problems/by-slug/${slug}`);
    if (!problem) notFound();

    return <WorkspaceClient problem={problem} token={token ?? ''} />;
}
