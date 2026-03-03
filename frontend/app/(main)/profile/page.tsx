import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api';
import { redirect } from 'next/navigation';
import type { SubmissionListResponse } from '@/types';
import { ProfileClient } from '@/components/profile/ProfileClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My Profile' };

export default async function ProfilePage() {
    const jar = await cookies();
    const token = jar.get('coderly_token')?.value;
    const username = decodeURIComponent(jar.get('coderly_uname')?.value ?? '');
    const userId = jar.get('coderly_uid')?.value ?? '';

    if (!token) redirect('/login?redirect=/profile');

    // Fetch submission history server-side
    const submissionsData = await serverFetch<SubmissionListResponse>(
        `/submissions/user/me?page=1&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    const submissions = submissionsData?.submissions ?? [];
    const total = submissionsData?.total ?? 0;

    return <ProfileClient username={username} userId={userId} submissions={submissions} total={total} token={token} />;
}
