'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Layers, Globe, Radio, Play, History, TrendingUp } from 'lucide-react';

const features = [
    {
        icon: Layers,
        title: 'Curated Problem Set',
        body: 'Every problem is hand-picked. We removed the noise so you can focus on the foundations that actually matter.',
        tag: 'Problems Service',
    },
    {
        icon: Globe,
        title: 'Multiple Languages',
        body: 'Write in JavaScript, TypeScript, Python, Java, C++, or C. Your language, your rules.',
        tag: 'Execution Engine',
    },
    {
        icon: Radio,
        title: 'Real-Time Output',
        body: 'Your code runs in a sandboxed container. Output streams live to your terminal via WebSocket — no polling, no lag.',
        tag: 'WebSocket Streaming',
    },
    {
        icon: Play,
        title: 'Test Run (no penalty)',
        body: 'Hit Run to test your logic before committing to a submission. 10 test runs per day — experiment freely.',
        tag: 'POST /submissions/run',
    },
    {
        icon: History,
        title: 'Submission History',
        body: 'Every submission is tracked. Review your past attempts, see how your code improved, celebrate your Accepted streak.',
        tag: 'Submission Service',
    },
    {
        icon: TrendingUp,
        title: 'Guided Difficulty',
        body: 'Easy, Medium, Hard — filter by what you\'re ready for. Build skill in layers, not in leaps.',
        tag: 'Difficulty Filter',
    },
];

export function FeatureGrid() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section ref={ref} className="py-24 px-6" style={{ background: 'linear-gradient(180deg, transparent, rgba(26,5,51,0.5), transparent)' }}>
            <div className="max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-14">
                    <span className="inline-block px-3 py-1 rounded-full border border-[var(--brand-700)] bg-[var(--brand-900)] text-[var(--brand-300)] text-xs font-medium mb-4">
                        What's inside
                    </span>
                    <h2 className="text-4xl font-black text-[var(--text-primary)]">Everything you need. <span className="gradient-text">Nothing you don't.</span></h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 25 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 + 0.2 }}
                            className="glass rounded-2xl p-6 border border-[var(--border-subtle)] hover:border-[var(--brand-600)] transition-all group hover:glow-sm">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-700)] to-[var(--brand-900)] border border-[var(--brand-600)] flex items-center justify-center mb-4 group-hover:from-[var(--brand-500)] group-hover:to-[var(--brand-700)] transition-all">
                                <f.icon size={18} className="text-[var(--brand-300)]" />
                            </div>
                            <h3 className="font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--brand-200)] transition-colors">{f.title}</h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">{f.body}</p>
                            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-0.5 rounded">{f.tag}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
