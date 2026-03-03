
export interface Template {
    language: string;   // e.g., "python", "javascript", "cpp"
    code: string;       // Starter code with function signature
}

/** Test case used to validate user submissions */
export interface TestCase {
    input: string;      // Input to feed to the solution
    expected: string;   // Expected output for comparison
}

/** A coding challenge with all metadata needed for display and execution */
export interface Problem {
    id: string;
    title: string;
    slug: string;                             // URL-friendly identifier
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;                         // e.g., "Arrays", "Dynamic Programming"
    description: string;                      // Markdown-formatted problem statement
    templates: Template[];                    // Starter code for each supported language
    test_cases: TestCase[];                   // Validation test cases
    constraints: string[];                    // Time/space complexity hints
}

/** Paginated response from the Problem Service */
export interface ProblemListResponse {
    problems: Problem[];
    total: number;
    page: number;
    limit: number;
}

// ─── Submission Domain ──────────────────────────────────────────────────────────

/** Lifecycle states for a code submission */
export type SubmissionStatus =
    | 'pending'              // Queued, waiting for execution
    | 'running'              // Currently executing in sandbox
    | 'accepted'             // All test cases passed
    | 'wrong_answer'         // Output mismatch
    | 'time_limit_exceeded'  // Execution took too long
    | 'runtime_error'        // Crash during execution
    | 'compile_error';       // Failed to compile (Java, C++, etc.)

/** A user's code submission with execution results */
export interface Submission {
    id: string;
    user_id: string;
    problem_id: string;
    language: string;
    code_body: string;
    status: SubmissionStatus;
    execution_time: number;   // Milliseconds
    memory_used: number;      // Bytes
    created_at: string;       // ISO timestamp
}

/** Paginated response from the Submission Service */
export interface SubmissionListResponse {
    submissions: Submission[];
    total: number;
    page: number;
    limit: number;
}

// ─── User & Auth Domain ─────────────────────────────────────────────────────────

/** Authenticated user identity */
export interface User {
    userId: string;
    username: string;
}

/** Response from login/register endpoints */
export interface AuthResponse {
    success: boolean;
    accessToken: string;   // JWT for subsequent API calls
    userId: string;
    username: string;
}

// ─── Real-time Execution Domain ─────────────────────────────────────────────────

/** Log entry streamed during code execution via WebSocket */
export interface ExecutionLog {
    type: 'stdout' | 'stderr' | 'system';   // Output stream source
    payload: string;                         // Log content
    submissionId: string;                    // Associated submission
}
