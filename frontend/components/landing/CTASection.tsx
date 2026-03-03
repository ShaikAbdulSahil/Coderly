'use client';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Code2 } from 'lucide-react';

export function CTASection() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <section ref={ref} className="py-24 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
                    className="relative rounded-3xl p-12 text-center overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, var(--brand-900), var(--brand-800), #1e0040)' }}>
                    {/* Decorative glow */}
                    <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.4), transparent 70%)' }} />
                    <div className="absolute inset-0 border border-[var(--brand-600)] rounded-3xl" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--brand-800)] border border-[var(--brand-600)] text-[var(--brand-300)] text-sm font-medium mb-6">
                            <Code2 size={14} />
                            Free to start. No credit card.
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
                            Coderly is where your <br /><span className="gradient-text">coding journey begins.</span>
                        </h2>
                        <p className="text-[var(--brand-200)] text-lg mb-8 max-w-lg mx-auto">
                            Not where it ends. Start with one problem today. Build the habit. Watch what happens in 30 days.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link href="/register"
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[var(--brand-900)] font-bold text-sm hover:bg-[var(--brand-100)] transition-all">
                                Start for free <ArrowRight size={16} />
                            </Link>
                            <Link href="/problems"
                                className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[var(--brand-500)] text-[var(--brand-300)] hover:bg-[var(--brand-800)] font-bold text-sm transition-all">
                                Browse problems
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Footer tagline */}
                <p className="text-center text-xs text-[var(--text-muted)] mt-8">
                    We don&apos;t have 3,000 problems. We have the <em>right</em> problems.
                </p>
            </div>
        </section>
    );
}
