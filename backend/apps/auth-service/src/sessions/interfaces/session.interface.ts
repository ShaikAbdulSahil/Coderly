/**
 * UserSession entity — represents a row in the `user_sessions` table.
 * Token versioning enables JWT revocation: if the version in the JWT
 * doesn't match the DB, the token is considered invalid.
 */
export interface UserSession {
    id: string;
    user_id: string;
    token_version: number;
    last_login: Date;
}
