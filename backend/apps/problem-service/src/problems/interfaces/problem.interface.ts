/**
 * Proto-compatible shape for a Problem document.
 * Used when converting Mongoose docs to gRPC responses.
 */
export interface ProblemProto {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    category: string;
    description: string;
    templates: { language: string; code: string }[];
    test_cases: { input: string; expected: string }[];
    constraints: string[];
}
