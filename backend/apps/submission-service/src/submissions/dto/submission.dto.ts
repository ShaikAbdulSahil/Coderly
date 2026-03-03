/**
 * DTOs for the Submission feature module.
 */

export class CreateSubmissionDto {
    user_id: string;
    userId?: string;
    problem_id: string;
    problemId?: string;
    language: string;
    code_body: string;
    codeBody?: string;
    is_test_run?: boolean;
    isTestRun?: boolean;
}

export class UpdateStatusDto {
    id: string;
    status: string;
    execution_time: number;
    memory_used: number;
}
