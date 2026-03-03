import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

/** POST /api/problems body */
export class CreateProblemDto {
    @IsString() @IsNotEmpty() title: string;
    @IsString() @IsNotEmpty() slug: string;
    @IsString() @IsNotEmpty() difficulty: string;
    @IsString() @IsNotEmpty() category: string;
    @IsString() @IsNotEmpty() description: string;
    @IsArray() @IsOptional() templates: { language: string; code: string }[];
    @IsArray() @IsOptional() test_cases: { input: string; expected: string }[];
    @IsArray() @IsOptional() constraints: string[];
}

/** PUT /api/problems/:id body */
export class UpdateProblemDto {
    @IsOptional() @IsString() title?: string;
    @IsOptional() @IsString() slug?: string;
    @IsOptional() @IsString() difficulty?: string;
    @IsOptional() @IsString() category?: string;
    @IsOptional() @IsString() description?: string;
    @IsArray() @IsOptional() templates?: { language: string; code: string }[];
    @IsArray() @IsOptional() test_cases?: { input: string; expected: string }[];
    @IsArray() @IsOptional() constraints?: string[];
}
