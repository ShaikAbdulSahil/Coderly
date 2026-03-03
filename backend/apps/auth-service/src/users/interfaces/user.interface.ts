/**
 * User entity — represents a row in the `users` table.
 */
export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
}
