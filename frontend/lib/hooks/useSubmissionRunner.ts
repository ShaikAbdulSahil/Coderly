/**
 * useSubmissionRunner Hook
 * ════════════════════════════════════════════════════════════════════════════════
 * Manages the complete lifecycle of code submission and real-time execution feedback.
 * 
 * Key Features:
 * - WebSocket connection for live execution logs (stdout/stderr streaming)
 * - Automatic reconnection with token-based authentication
 * - Fallback HTTP polling for result delivery (resilience layer)
 * - Local storage sync for tracking solved problems per user
 * 
 * Architecture:
 * Client ──WebSocket──▶ API Gateway ──gRPC Stream──▶ Execution Engine
 */
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { startSubmission, appendLog, setStatus } from '@/store';
import type { Problem } from '@/types';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';

export function useSubmissionRunner(problem: Problem, token: string) {
    const dispatch = useDispatch<AppDispatch>();
    const { activeId, status, logs, isRunning } = useSelector((s: RootState) => s.submission);
    const socketRef = useRef<Socket | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { userId } = useSelector((s: RootState) => s.auth);

    // Connect WebSocket on mount
    useEffect(() => {
        if (!token) return;
        const socket = io('http://localhost:3000/execution', {
            query: { token },
            transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('execution:log', (data: { type: string; payload: string }) => {
            dispatch(appendLog({ type: data.type as any, payload: data.payload }));
        });

        socket.on('submission:result', (data: any) => {
            dispatch(setStatus(data.status));
            if (pollRef.current) clearInterval(pollRef.current);
        });

        return () => { socket.disconnect(); };
    }, [token, dispatch]);

    const runOrSubmit = useCallback(async (code: string, language: string, isTestRun = false) => {
        if (!token) return;
        try {
            const res = isTestRun
                ? await api.submissions.run({ problemId: problem.id, language, codeBody: code }, token)
                : await api.submissions.create({ problemId: problem.id, language, codeBody: code }, token);

            const id = res.submission?.id;
            if (!id) return;
            dispatch(startSubmission(id));

            // Subscribe for WS execution logs
            socketRef.current?.emit('execute:subscribe', { submissionId: id });

            if (!isTestRun) {
                // Poll for final status (backup to WS result event)
                pollRef.current = setInterval(async () => {
                    try {
                        const sub = await api.submissions.getById(id, token);
                        if (sub?.status && sub.status !== 'pending' && sub.status !== 'running') {
                            dispatch(setStatus(sub.status));
                            clearInterval(pollRef.current!);

                            // Update solved IDs in localStorage on accepted
                            if (sub.status === 'accepted' && userId) {
                                try {
                                    const key = `coderly:solved:${userId}`;
                                    const raw = localStorage.getItem(key);
                                    const ids: string[] = raw ? JSON.parse(raw) : [];
                                    if (!ids.includes(problem.id)) {
                                        ids.push(problem.id);
                                        localStorage.setItem(key, JSON.stringify(ids));
                                    }
                                } catch { /* ignore */ }
                            }
                        }
                    } catch { /* ignore */ }
                }, 2000);
            }
        } catch (err) {
            dispatch(setStatus('runtime_error'));
        }
    }, [token, problem, dispatch, userId]);

    return { activeId, status, logs, isRunning, runOrSubmit };
}
