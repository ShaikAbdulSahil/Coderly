import { IsNotEmpty, IsString } from 'class-validator';

/** POST /api/submissions body */
export class CreateSubmissionDto {
    @IsString() @IsNotEmpty({ message: 'Problem ID is required' })
    problemId: string;

    @IsString() @IsNotEmpty({ message: 'Language is required' })
    language: string;

    @IsString() @IsNotEmpty({ message: 'Code is required' })
    codeBody: string;
}
