/**
 * API Client Library
 * ════════════════════════════════════════════════════════════════════════════════
 * Type-safe HTTP client for communicating with the Coderly backend.
 * 
 * Architecture:
 * - Client-side: Next.js rewrites /api/* → http://localhost:3000/api/*
 * - Server-side: Direct fetch to backend for RSC (React Server Components)
 * 
 * Features:
 * - Automatic JWT injection via Bearer token
 * - Structured error handling with typed responses
 * - Centralized endpoint definitions for auth, problems, and submissions
 */

const BASE = '/api';

async function fetchApi<T>(
    path: string,
    options: RequestInit = {},
    token?: string
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `API error ${res.status}`);
    }
    return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
    auth: {
        login: (email: string, password: string) =>
            fetchApi<{ success: boolean; accessToken: string; userId: string; username: string }>(
                '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
            ),
        register: (username: string, email: string, password: string) =>
            fetchApi<{ success: boolean; message: string; userId: string }>(
                '/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }
            ),
        me: (token: string) =>
            fetchApi<{ userId: string; username: string }>('/auth/me', {}, token),
    },

    problems: {
        list: (params: { category?: string; difficulty?: string; page?: number; limit?: number }, token?: string) => {
            const qs = new URLSearchParams();
            if (params.category) qs.set('category', params.category);
            if (params.difficulty) qs.set('difficulty', params.difficulty);
            if (params.page) qs.set('page', String(params.page));
            if (params.limit) qs.set('limit', String(params.limit));
            return fetchApi<{ problems: any[]; total: number; page: number; limit: number }>(
                `/problems?${qs}`, {}, token
            );
        },
        getById: (id: string, token?: string) =>
            fetchApi<any>(`/problems/${id}`, {}, token),
        getBySlug: (slug: string, token?: string) =>
            fetchApi<any>(`/problems/by-slug/${slug}`, {}, token),
    },

    submissions: {
        create: (body: { problemId: string; language: string; codeBody: string }, token: string) =>
            fetchApi<{ success: boolean; submission: any }>(
                '/submissions', { method: 'POST', body: JSON.stringify(body) }, token
            ),
        run: (body: { problemId: string; language: string; codeBody: string }, token: string) =>
            fetchApi<{ success: boolean; submission: any }>(
                '/submissions/run', { method: 'POST', body: JSON.stringify(body) }, token
            ),
        getById: (id: string, token: string) =>
            fetchApi<any>(`/submissions/${id}`, {}, token),
        mySubmissions: (page = 1, limit = 10, token: string) =>
            fetchApi<{ submissions: any[]; total: number; page: number; limit: number }>(
                `/submissions/user/me?page=${page}&limit=${limit}`, {}, token
            ),
    },
};

// ─── Server-side helpers (use in RSC with full URL) ──────────────────────────
export const SERVER_API = 'http://localhost:3000/api';

export async function serverFetch<T>(path: string, options: RequestInit = {}): Promise<T | null> {
    try {
        const res = await fetch(`${SERVER_API}${path}`, { ...options, next: { revalidate: 90 } });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}
