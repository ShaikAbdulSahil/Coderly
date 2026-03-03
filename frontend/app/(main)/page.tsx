import { serverFetch } from '@/lib/api';
import type { ProblemListResponse } from '@/types';
import { HeroSection } from '@/components/landing/HeroSection';
import { MomentumSection } from '@/components/landing/MomentumSection';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { ThirtyDaysSection } from '@/components/landing/ThirtyDaysSection';
import { FeaturedProblems } from '@/components/landing/FeaturedProblems';
import { CTASection } from '@/components/landing/CTASection';
import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Coderly — Build Confidence. Solve Problems.',
};

export default async function LandingPage() {
    const data = await serverFetch<ProblemListResponse>('/problems?limit=6&difficulty=Easy');
    const problems = data?.problems ?? [];

    return (
        <div className="overflow-hidden">
            <HeroSection />
            <MomentumSection />
            <FeatureGrid />
            <ThirtyDaysSection />
            <FeaturedProblems problems={problems} />
            <CTASection />
        </div>
    );
}
