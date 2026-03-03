'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const codeSnippet = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
}
// ✓ Test passed in 48ms`;

export function HeroSection() {
    return (
        <section className="relative min-h-[92vh] flex items-center justify-center px-6 overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(124,58,237,0.25) 0%, transparent 65%)' }}>
            {/* Animated grid bg */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: 'linear-gradient(var(--brand-400) 1px, transparent 1px), linear-gradient(90deg, var(--brand-400) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
            }} />

            {/* Glow orbs */}
            <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[var(--brand-600)] rounded-full opacity-10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[var(--brand-400)] rounded-full opacity-10 blur-[80px] pointer-events-none" />

            <div className="relative z-10 max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: copy */}
                <div>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--brand-700)] bg-[var(--brand-900)] text-[var(--brand-300)] text-xs font-medium mb-6">
                        <Sparkles size={12} />
                        Built for beginners. Serious about results.
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                        <span className="text-[var(--text-primary)]">Code your way</span>
                        <br />
                        <span className="gradient-text">to confidence.</span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="mt-6 text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">
                        LeetCode made you quit. Coderly makes you stay. We have <strong className="text-[var(--text-primary)]">the right problems</strong> — curated
                        to build momentum, not intimidation.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="mt-8 flex flex-wrap gap-3">
                        <Link href="/problems"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand-500)] hover:bg-[var(--brand-400)] text-white font-semibold text-sm transition-all glow hover:glow">
                            Start Solving <ArrowRight size={16} />
                        </Link>
                        <Link href="/register"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--brand-500)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold text-sm transition-all">
                            Create free account
                        </Link>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                        className="mt-10 flex items-center gap-6 text-sm text-[var(--text-muted)]">
                        <span>✓ No credit card</span>
                        <span>✓ Multiple languages</span>
                        <span>✓ Real-time output</span>
                    </motion.div>
                </div>

                {/* Right: floating code card */}
                <motion.div initial={{ opacity: 0, x: 40, rotateY: 10 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    transition={{ delay: 0.3, duration: 0.8, type: 'spring', stiffness: 80 }}
                    className="hidden lg:block">
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        className="glass rounded-2xl p-6 glow border border-[var(--brand-700)]">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                            <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                            <span className="ml-2 text-xs text-[var(--text-muted)] mono">two-sum.js</span>
                        </div>
                        <pre className="text-xs text-[var(--brand-300)] font-mono leading-relaxed overflow-x-auto">{codeSnippet}</pre>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-5 h-8 rounded-full border-2 border-[var(--brand-700)] flex items-start justify-center pt-1.5">
                    <div className="w-1 h-2 rounded-full bg-[var(--brand-400)]" />
                </motion.div>
            </motion.div>
        </section>
    );
}
