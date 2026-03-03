'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const insights = [
    {
        stat: '#1',
        label: 'Reason people quit coding',
        insight: 'They start with the wrong problems.',
        color: 'var(--error)',
    },
    {
        stat: '87%',
        label: 'Of LeetCode beginners',
        insight: 'Give up within 2 weeks.',
        color: 'var(--warning)',
    },
    {
        stat: '30',
        label: 'Curated problems',
        insight: 'That\'s all it takes to feel the shift.',
        color: 'var(--success)',
    },
];

const pillars = [
    {
        icon: '🏆',
        title: 'Small wins first',
        body: 'Start with problems where you can reason your way to a solution without memorizing algorithms. Every passing test case hits different.',
    },
    {
        icon: '⚡',
        title: 'Immediate feedback',
        body: 'See your code run. See it fail. Adjust. The tighter this loop, the faster your brain rewires for problem solving.',
    },
    {
        icon: '🧠',
        title: 'Confidence over speed',
        body: 'A beginner who solves 30 problems confidently is better positioned than one who half-understood 200 solutions by looking them up.',
    },
];

export function MomentumSection() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section ref={ref} className="py-28 px-6 relative">
            <div className="max-w-6xl mx-auto">
                {/* Headline */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
                    className="text-center mb-16">
                    <span className="inline-block px-3 py-1 rounded-full border border-[var(--brand-700)] bg-[var(--brand-900)] text-[var(--brand-300)] text-xs font-medium mb-4">
                        The Momentum Problem
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] leading-tight max-w-3xl mx-auto">
                        The platform was the problem. <span className="gradient-text">Not you.</span>
                    </h2>
                    <p className="mt-5 text-[var(--text-secondary)] text-lg max-w-2xl mx-auto leading-relaxed">
                        LeetCode and HackerRank are built for software engineers prepping for FAANG interviews.
                        If you walked in as a beginner, you were set up to feel stupid. That stops here.
                    </p>
                </motion.div>

                {/* Stats row */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    {insights.map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1 + 0.2 }}
                            className="glass rounded-2xl p-6 text-center border border-[var(--border-subtle)]">
                            <div className="text-5xl font-black mb-2" style={{ color: item.color }}>{item.stat}</div>
                            <div className="text-xs text-[var(--text-muted)] mb-2">{item.label}</div>
                            <div className="text-sm text-[var(--text-secondary)] font-medium">{item.insight}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Three pillars */}
                <div className="grid md:grid-cols-3 gap-6">
                    {pillars.map((p, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.12 + 0.4 }}
                            className="glass rounded-2xl p-7 border border-[var(--border-subtle)] hover:border-[var(--brand-700)] transition-colors group">
                            <div className="text-3xl mb-4">{p.icon}</div>
                            <h3 className="font-bold text-[var(--text-primary)] text-lg mb-3 group-hover:text-[var(--brand-300)] transition-colors">{p.title}</h3>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{p.body}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Pull quote */}
                <motion.blockquote initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.8 }}
                    className="mt-16 text-center text-2xl font-bold text-[var(--text-primary)] max-w-2xl mx-auto leading-snug">
                    "Before you can solve Hard problems,<br />
                    <span className="gradient-text">you need to believe you can solve Easy ones."</span>
                </motion.blockquote>
            </div>
        </section>
    );
}
