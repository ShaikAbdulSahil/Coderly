/**
 * WorkspaceClient — Interactive Code Editor & Problem Workspace
 * ════════════════════════════════════════════════════════════════════════════════
 * The heart of the coding experience. Provides a split-pane interface with:
 * - Problem description panel (left)
 * - Monaco code editor with multi-language support (right-top)
 * - Real-time execution output panel (right-bottom)
 * 
 * Features:
 * - Language switching with automatic template injection
 * - Run (test) vs Submit (official) execution modes
 * - Live stdout/stderr streaming during execution
 * - Persistent solved-status tracking via localStorage
 */
'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { Problem } from '@/types';
import { useSubmissionRunner } from '@/lib/hooks/useSubmissionRunner';
import { ProblemPanel } from './ProblemPanel';
import { OutputPanel } from './OutputPanel';
import { Play, Send, ChevronDown, Code2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

// Monaco is loaded dynamically to reduce initial bundle size (code-splitting)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Supported languages aligned with Execution Engine container images
const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'c'];
const LANG_LABEL: Record<string, string> = {
    javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python',
    java: 'Java', cpp: 'C++', c: 'C',
};

/** Retrieves the starter code template for the selected language */
function getInitialCode(problem: Problem, lang: string): string {
    const t = problem.templates?.find(t => t.language === lang);
    return t?.code ?? `// Write your ${LANG_LABEL[lang]} solution here\n`;
}

interface Props {
    problem: Problem;
    token: string;
}

export function WorkspaceClient({ problem, token }: Props) {
    const { userId } = useSelector((s: RootState) => s.auth);
    const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
    useEffect(() => {
        if (!userId) return;
        try {
            const raw = localStorage.getItem(`coderly:solved:${userId}`);
            if (raw) setSolvedIds(new Set(JSON.parse(raw)));
        } catch { /* ignore */ }
    }, [userId]);

    const [language, setLanguage] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(() => getInitialCode(problem, LANGUAGES[0]));
    const [showLangMenu, setShowLangMenu] = useState(false);

    const { status, logs, isRunning, runOrSubmit } = useSubmissionRunner(problem, token);

    function onLangChange(lang: string) {
        setLanguage(lang);
        setCode(getInitialCode(problem, lang));
        setShowLangMenu(false);
    }

    const isSolved = solvedIds.has(problem.id);

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            {/* Top bar */}
            <div className="h-12 glass border-b border-[var(--border-subtle)] px-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Code2 size={16} className="text-[var(--brand-400)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px]">{problem.title}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${problem.difficulty === 'Easy' ? 'badge-easy' : problem.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'
                        }`}>{problem.difficulty}</span>
                    {isSolved && <span className="text-xs text-[var(--success)] font-medium">✓ Solved</span>}
                </div>

                <div className="flex items-center gap-2">
                    {/* Language selector */}
                    <div className="relative">
                        <button onClick={() => setShowLangMenu(o => !o)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--brand-500)] transition-colors">
                            {LANG_LABEL[language]} <ChevronDown size={12} />
                        </button>
                        {showLangMenu && (
                            <div className="absolute right-0 top-9 z-50 w-36 glass rounded-xl border border-[var(--border)] py-1 shadow-xl">
                                {LANGUAGES.map(l => (
                                    <button key={l} onClick={() => onLangChange(l)}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${l === language ? 'text-[var(--brand-300)] bg-[var(--brand-800)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                                            }`}>
                                        {LANG_LABEL[l]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Run */}
                    <button disabled={isRunning} onClick={() => runOrSubmit(code, language, true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--success)] hover:border-[var(--success)] disabled:opacity-50 transition-all">
                        <Play size={12} fill="currentColor" /> Run
                    </button>

                    {/* Submit */}
                    <button disabled={isRunning} onClick={() => runOrSubmit(code, language, false)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--brand-500)] hover:bg-[var(--brand-400)] text-white disabled:opacity-50 transition-all glow-sm">
                        <Send size={12} /> Submit
                    </button>
                </div>
            </div>

            {/* Main panels */}
            <Group orientation="horizontal" className="flex-1 min-h-0">
                {/* Left: Problem description */}
                <Panel defaultSize={40} minSize={25} maxSize={60}>
                    <ProblemPanel problem={problem} isSolved={isSolved} />
                </Panel>

                <Separator className="w-1.5 bg-[var(--border)] hover:bg-[var(--brand-500)] transition-colors cursor-col-resize" />

                {/* Right: Editor + Output */}
                <Panel defaultSize={60}>
                    <Group orientation="vertical">
                        {/* Code editor */}
                        <Panel defaultSize={65} minSize={30}>
                            <div className="h-full bg-[#0d0118]">
                                <MonacoEditor
                                    height="100%"
                                    language={language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : language}
                                    value={code}
                                    onChange={v => setCode(v ?? '')}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        padding: { top: 12, bottom: 12 },
                                        lineNumbers: 'on',
                                        tabSize: 2,
                                        wordWrap: 'on',
                                        suggestOnTriggerCharacters: true,
                                    }}
                                />
                            </div>
                        </Panel>

                        <Separator className="h-1.5 bg-[var(--border)] hover:bg-[var(--brand-500)] transition-colors cursor-row-resize" />

                        {/* Output panel */}
                        <Panel defaultSize={35} minSize={15}>
                            <OutputPanel logs={logs} status={status} isRunning={isRunning} />
                        </Panel>
                    </Group>
                </Panel>
            </Group>
        </div>
    );
}
