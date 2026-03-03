/**
 * DTOs for the Auth feature module.
 * These are used internally for type safety — not for HTTP validation
 * (this is a gRPC microservice, HTTP validation happens at the gateway).
 */

export class RegisterDto {
    username: string;
    email: string;
    password: string;
}

export class LoginDto {
    email: string;
    password: string;
}

export class ValidateTokenDto {
    token: string;
}
