/**
 * DTOs for the Problem feature module.
 * Internal type safety for gRPC handlers.
 */

export class CreateProblemDto {
    title: string;
    slug: string;
    difficulty: string;
    category: string;
    description: string;
    templates: { language: string; code: string }[];
    test_cases: { input: string; expected: string }[];
    constraints: string[];
}

export class UpdateProblemDto {
    id: string;
    title?: string;
    slug?: string;
    difficulty?: string;
    category?: string;
    description?: string;
    templates?: { language: string; code: string }[];
    test_cases?: { input: string; expected: string }[];
    constraints?: string[];
}

export class ProblemFilterDto {
    category: string;
    difficulty: string;
    page: number;
    limit: number;
}
