-- =============================================
-- Coderly: Submission Service Database Schema
-- Run this against your PostgreSQL database
-- =============================================

\c coderly_submissions;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    problem_id      VARCHAR(50) NOT NULL,
    language        VARCHAR(20) NOT NULL,
    code_body       TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'accepted', 'wrong_answer', 'error')),
    execution_time  INT DEFAULT 0,
    memory_used     INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
