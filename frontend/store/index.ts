/**
 * Redux Store Configuration
 * ════════════════════════════════════════════════════════════════════════════════
 * Centralized state management using Redux Toolkit.
 * 
 * Slices:
 * - auth: JWT token, user identity, and authentication status
 * - submission: Active submission tracking, execution logs, and status
 * 
 * The store enables real-time UI updates during code execution by
 * dispatching log entries as they stream in via WebSocket.
 */
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Auth Slice ─── Manages JWT session and user identity ─────────────────
interface AuthState {
    token: string | null;
    userId: string | null;
    username: string | null;
    isAuthenticated: boolean;
}

const authSlice = createSlice({
    name: 'auth',
    initialState: { token: null, userId: null, username: null, isAuthenticated: false } as AuthState,
    reducers: {
        setAuth(state, action: PayloadAction<{ token: string; userId: string; username: string }>) {
            state.token = action.payload.token;
            state.userId = action.payload.userId;
            state.username = action.payload.username;
            state.isAuthenticated = true;
        },
        logout(state) {
            state.token = null;
            state.userId = null;
            state.username = null;
            state.isAuthenticated = false;
        },
    },
});

// ─── Submission Slice ─── Tracks active execution and real-time logs ───────
interface LogEntry {
    type: 'stdout' | 'stderr' | 'system';  // Stream source
    payload: string;                        // Log content
}

interface SubmissionState {
    activeId: string | null;   // Currently executing submission
    status: string;            // pending → running → accepted/error
    logs: LogEntry[];          // Streamed execution output
    isRunning: boolean;        // UI loading state
}

const submissionSlice = createSlice({
    name: 'submission',
    initialState: { activeId: null, status: '', logs: [], isRunning: false } as SubmissionState,
    reducers: {
        startSubmission(state, action: PayloadAction<string>) {
            state.activeId = action.payload;
            state.status = 'pending';
            state.logs = [];
            state.isRunning = true;
        },
        appendLog(state, action: PayloadAction<LogEntry>) {
            state.logs.push(action.payload);
        },
        setStatus(state, action: PayloadAction<string>) {
            state.status = action.payload;
            if (action.payload !== 'pending' && action.payload !== 'running') {
                state.isRunning = false;
            }
        },
        resetSubmission(state) {
            state.activeId = null;
            state.status = '';
            state.logs = [];
            state.isRunning = false;
        },
    },
});

export const { setAuth, logout } = authSlice.actions;
export const { startSubmission, appendLog, setStatus, resetSubmission } = submissionSlice.actions;

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        submission: submissionSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
