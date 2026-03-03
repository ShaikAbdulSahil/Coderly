'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const days = [
    { range: 'Day 1–7', topic: 'Strings & Arrays', desc: 'Build intuition on the most common data structures. Every problem you\'ll ever see is hiding here.', color: '#22c55e' },
    { range: 'Day 8–14', topic: 'Loops & Conditions', desc: 'Stop writing code that "kinda works." Recognize patterns. Learn to trace through your own logic.', color: '#34d399' },
    { range: 'Day 15–21', topic: 'Maps & Functions', desc: 'Think in data structures. Start decomposing problems into smaller pieces. Complexity becomes navigable.', color: '#a855f7' },
    { range: 'Day 22–30', topic: 'Your First Medium', desc: 'Solve your first Medium problem. Feel the shift. That\'s the moment everything changes.', color: '#7c3aed' },
];

export function ThirtyDaysSection() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section ref={ref} className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-14">
                    <span className="inline-block px-3 py-1 rounded-full border border-[var(--brand-700)] bg-[var(--brand-900)] text-[var(--brand-300)] text-xs font-medium mb-4">
                        Your First 30 Days
                    </span>
                    <h2 className="text-4xl font-black text-[var(--text-primary)] leading-tight">
                        A path that actually <span className="gradient-text">makes sense.</span>
                    </h2>
                    <p className="mt-4 text-[var(--text-secondary)] max-w-lg mx-auto">
                        No random problem-dump. A deliberate learning arc that takes you from "I don't know where to start" to "I just solved a Medium."
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[28px] top-4 bottom-4 w-px bg-gradient-to-b from-[var(--success)] via-[var(--brand-500)] to-[var(--brand-700)] opacity-40" />

                    <div className="space-y-8">
                        {days.map((d, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.15 + 0.3 }}
                                className="flex gap-6">
                                {/* Step circle */}
                                <div className="relative z-10 flex-shrink-0">
                                    <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xs font-black"
                                        style={{ borderColor: d.color, background: `${d.color}15`, color: d.color }}>
                                        {i + 1}
                                    </div>
                                </div>
                                {/* Content */}
                                <div className="glass rounded-2xl p-5 border border-[var(--border-subtle)] flex-1 hover:border-[var(--brand-600)] transition-colors">
                                    <span className="text-xs font-mono" style={{ color: d.color }}>{d.range}</span>
                                    <h3 className="font-bold text-[var(--text-primary)] text-lg mt-1 mb-2">{d.topic}</h3>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{d.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
