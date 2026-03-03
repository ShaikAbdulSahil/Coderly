/**
 * Submission entity — represents a row in the `submissions` table.
 *
 * Status flow: pending → running → accepted | wrong_answer | error
 */
export interface Submission {
    id: string;
    user_id: string;
    problem_id: string;
    language: string;
    code_body: string;
    status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'error';
    execution_time: number;  // milliseconds
    memory_used: number;     // kilobytes
    created_at: Date;
}
