# Coderly — System Flow Document

> Complete flow for every use case. Each section shows the request, every internal stage (caching, gRPC, DB, queue), and the response.

---

## 1. User Registration

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant AS as Auth Service
    participant PG as PostgreSQL

    C->>GW: POST /api/auth/register { username, email, password }
    GW->>GW: Validate DTO (class-validator)
    GW->>AS: gRPC AuthService.Register()
    AS->>PG: SELECT * FROM users WHERE email = $1
    alt Email exists
        AS-->>GW: { success: false, message: "Email taken" }
        GW-->>C: 400 Bad Request
    else Email available
        AS->>PG: SELECT * FROM users WHERE username = $1
        alt Username exists
            AS-->>GW: { success: false, message: "Username taken" }
            GW-->>C: 400 Bad Request
        else Username available
            AS->>AS: bcrypt.hash(password, 12 rounds)
            AS->>PG: INSERT INTO users (...) RETURNING *
            AS->>PG: INSERT INTO user_sessions (user_id, token_version=1)
            AS-->>GW: { success: true, userId }
            GW-->>C: 201 { success, message, userId }
        end
    end
```

**Logic:**
1. Gateway validates request body via `class-validator` (username ≥3 chars, valid email, password ≥6 chars)
2. Gateway calls Auth Service via gRPC `Register()` RPC
3. Auth Service checks for duplicate email → then duplicate username
4. Password is hashed with bcrypt (12 salt rounds)
5. User row inserted into PostgreSQL
6. Session row created with `token_version = 1`
7. Response sent back through the chain

---

## 2. User Login

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant AS as Auth Service
    participant PG as PostgreSQL

    C->>GW: POST /api/auth/login { email, password }
    GW->>GW: Validate DTO
    GW->>AS: gRPC AuthService.Login()
    AS->>PG: SELECT * FROM users WHERE email = $1
    alt User not found
        AS-->>GW: { success: false }
        GW-->>C: 401 Unauthorized
    else User found
        AS->>AS: bcrypt.compare(password, hash)
        alt Password wrong
            AS-->>GW: { success: false }
            GW-->>C: 401 Unauthorized
        else Password correct
            AS->>PG: UPDATE user_sessions SET token_version++, last_login=NOW()
            AS->>AS: JWT.sign({ sub, username, tokenVersion })
            AS-->>GW: { success, accessToken, userId, username }
            GW-->>C: 200 { accessToken, userId, username }
        end
    end
```

**Logic:**
1. Find user by email in PostgreSQL
2. Compare plaintext password against stored bcrypt hash
3. Bump `token_version` in `user_sessions` — this invalidates any previously issued JWTs
4. Sign new JWT with `{ sub: userId, username, tokenVersion }`, expiry from `JWT_EXPIRES_IN` env var
5. Return JWT to client

---

## 3. Token Validation (used by JWT Guard)

```mermaid
sequenceDiagram
    participant GW as API Gateway (JWT Guard)
    participant AS as Auth Service
    participant PG as PostgreSQL

    GW->>GW: Extract Bearer token from header
    GW->>AS: gRPC AuthService.ValidateToken()
    AS->>AS: JWT.verify(token) — check signature + expiry
    alt Invalid/expired
        AS-->>GW: { valid: false }
        GW-->>C: 401 Unauthorized
    else Valid
        AS->>PG: SELECT * FROM users WHERE id = $1
        AS->>PG: SELECT * FROM user_sessions WHERE user_id = $1
        alt Token version mismatch
            AS-->>GW: { valid: false }
            GW-->>C: 401 Unauthorized
        else All checks pass
            AS-->>GW: { valid: true, userId, username }
            GW->>GW: Attach user to request.user
        end
    end
```

**Token version check:** When a user logs in again, `token_version` is incremented. Old JWTs carry the old version number and are rejected — this is a simple revocation mechanism without maintaining a blacklist.

---

## 4. Get Problem by ID (with Caching)

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant RD as Redis Cache
    participant PS as Problem Service
    participant MG as MongoDB

    C->>GW: GET /api/problems/65f1a2b3...
    GW->>RD: GET "coderly:cache:problem:65f1a2b3..."
    alt Cache HIT
        RD-->>GW: Cached problem JSON
        GW-->>C: 200 (from cache, ~1ms)
    else Cache MISS
        RD-->>GW: null
        GW->>PS: gRPC ProblemService.GetProblemById()
        PS->>MG: db.problems.findById("65f1a2b3...")
        alt Not found
            PS-->>GW: gRPC NOT_FOUND
            GW-->>C: 404 Not Found
        else Found
            MG-->>PS: Problem document
            PS-->>GW: Problem proto response
            GW->>RD: SET "coderly:cache:problem:65f1a2b3..." EX 300
            GW-->>C: 200 Problem JSON
        end
    end
```

**Caching strategy:**
- **Key:** `coderly:cache:problem:{id}`
- **TTL:** 300 seconds (5 minutes)
- **Invalidation:** Cleared when the same problem is updated or deleted
- **Failure mode:** If Redis is down, cache operations fail silently — the request still works, just without caching

---

## 5. List Problems (with Caching)

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant RD as Redis Cache
    participant PS as Problem Service
    participant MG as MongoDB

    C->>GW: GET /api/problems?category=two-pointer&page=1&limit=10
    GW->>RD: GET "coderly:cache:problems:two-pointer:all:1:10"
    alt Cache HIT
        RD-->>GW: Cached list JSON
        GW-->>C: 200 (from cache)
    else Cache MISS
        GW->>PS: gRPC ProblemService.GetProblems()
        PS->>MG: db.problems.find({ category: /two-pointer/i }).skip(0).limit(10)
        PS->>MG: db.problems.countDocuments(filter)
        MG-->>PS: Results + count
        PS-->>GW: Problem list response
        GW->>RD: SET "coderly:cache:problems:two-pointer:all:1:10" EX 120
        GW-->>C: 200 { problems, total, page, limit }
    end
```

**Caching strategy:**
- **Key:** `coderly:cache:problems:{category}:{difficulty}:{page}:{limit}`
- **TTL:** 120 seconds (2 minutes — lists change more often)
- **Invalidation:** All list cache keys (`problems:*`) are wiped when any problem is created, updated, or deleted

---

## 6. Create/Update/Delete Problem (Cache Invalidation)

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant RD as Redis Cache
    participant PS as Problem Service
    participant MG as MongoDB

    C->>GW: POST /api/problems { title, slug, ... }
    GW->>PS: gRPC ProblemService.CreateProblem()
    PS->>MG: Check duplicate slug
    PS->>MG: db.problems.create(data)
    PS-->>GW: Created problem
    GW->>RD: DEL pattern "coderly:cache:problems:*" (invalidate list caches)
    GW-->>C: 201 Created problem

    Note over GW,RD: For UPDATE, also DEL "problem:{id}"
    Note over GW,RD: For DELETE, also DEL "problem:{id}"
```

---

## 7. Submit Code ("Run" Button) — The Heart of Coderly

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant SS as Submission Service
    participant PG as PostgreSQL
    participant RQ as Redis (BullMQ)
    participant EE as Execution Engine
    participant DK as Docker

    C->>GW: POST /api/submissions { problemId, language, codeBody }
    GW->>GW: JWT Guard validates token
    GW->>SS: gRPC SubmissionService.CreateSubmission()
    SS->>SS: Validate language ∈ [python, js, ts, java, cpp, c]
    SS->>PG: INSERT INTO submissions (..., status='pending')
    SS->>RQ: BullMQ queue.add("execute", { submissionId, language, codeBody })
    SS-->>GW: { id, status: "pending" }
    GW-->>C: 201 { success, submission }

    Note over C,GW: Client now opens WebSocket connection

    C->>GW: WS connect /execution?token=JWT
    GW->>GW: Validate token
    C->>GW: emit "execute:subscribe" { submissionId }

    Note over EE,RQ: Meanwhile, asynchronously...

    EE->>RQ: Pull job from code-execution queue
    EE->>EE: Initialize log store
    EE->>DK: docker run --rm --network=none --memory=256m python:3.11 ...
    DK-->>EE: stdout chunks (streaming)
    EE->>EE: Store log frames in ExecutionStore

    GW->>EE: gRPC ExecutionService.StreamExecutionLogs(submissionId)
    loop Every 200ms
        EE-->>GW: LogFrame { type: "stdout", payload: "..." }
        GW-->>C: WS emit "execution:log" { type, payload, submissionId }
    end

    DK-->>EE: Process exits (code 0)
    EE->>EE: Add result frame { status: "accepted", executionTimeMs: 42 }
    EE->>EE: Mark job complete
    EE-->>GW: Stream complete
    GW-->>C: WS emit "execution:complete" { submissionId }
```

**Full pipeline breakdown:**

| Stage | What Happens | Where |
|-------|-------------|-------|
| 1. HTTP Request | User hits "Run", POST body with code | Browser → Gateway |
| 2. JWT Validation | Guard extracts + validates Bearer token | Gateway (JwtAuthGuard) |
| 3. gRPC Call | Gateway calls SubmissionService.CreateSubmission | Gateway → Submission Service |
| 4. Language Check | Validates language is supported | Submission Service |
| 5. DB Insert | Saves submission with status=pending | Submission Service → PostgreSQL |
| 6. Queue Job | Pushes to BullMQ `code-execution` queue | Submission Service → Redis |
| 7. HTTP Response | Returns submission ID to client | Gateway → Browser |
| 8. WebSocket Connect | Client opens WS, authenticates with JWT | Browser → Gateway |
| 9. Subscribe | Client emits `execute:subscribe` | Browser → Gateway |
| 10. Job Pickup | BullMQ worker dequeues the job | Redis → Execution Engine |
| 11. Docker Run | Spawns container with code, timeouts, limits | Execution Engine → Docker |
| 12. Streaming | stdout/stderr flow: Docker → Engine → gRPC → WS → Browser | Full pipeline |
| 13. Completion | Final result frame, stream closes | Engine → Gateway → Browser |

**Edge cases handled:**
- **Timeout:** If code runs >10s, process is killed, `error` + "Time Limit Exceeded" returned
- **Runtime error:** Non-zero exit code → `error` + "Runtime Error"
- **No Docker:** Falls back to local `child_process` execution (dev mode)
- **BullMQ retry:** Jobs retry once (after 3s) on failure
- **WebSocket auth failure:** Connection rejected with error event
- **Redis down:** Cache operations fail silently, gRPC calls still work

---

## 8. Get Submission Status

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant SS as Submission Service
    participant PG as PostgreSQL

    C->>GW: GET /api/submissions/:id
    GW->>GW: JWT Guard validates token
    GW->>SS: gRPC SubmissionService.GetSubmission()
    SS->>PG: SELECT * FROM submissions WHERE id = $1
    alt Found
        SS-->>GW: Submission data
        GW-->>C: 200 { id, status, execution_time, ... }
    else Not found
        SS-->>GW: gRPC NOT_FOUND
        GW-->>C: 404 Not Found
    end
```

---

## 9. Get My Submissions

```mermaid
sequenceDiagram
    participant C as Browser
    participant GW as API Gateway
    participant SS as Submission Service
    participant PG as PostgreSQL

    C->>GW: GET /api/submissions/user/me?page=1&limit=10
    GW->>GW: JWT Guard → extracts userId from token
    GW->>SS: gRPC GetUserSubmissions({ user_id, page, limit })
    SS->>PG: SELECT * FROM submissions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10
    SS->>PG: SELECT COUNT(*) FROM submissions WHERE user_id=$1
    SS-->>GW: { submissions, total }
    GW-->>C: 200 { submissions, total, page, limit }
```

---

## Error Handling Summary

| Layer | How Errors Are Handled |
|-------|----------------------|
| **Gateway (HTTP)** | Validation errors → 400, Auth errors → 401, Not found → 404, Server errors → 500 |
| **Gateway (WS)** | Auth failure → `error` event + disconnect, Stream failure → `execution:error` event |
| **gRPC (internal)** | `RpcException` with codes: `INVALID_ARGUMENT`, `NOT_FOUND`, `ALREADY_EXISTS` |
| **Database** | Connection pool auto-reconnects, query errors bubble up as 500 |
| **Redis Cache** | Failures are caught silently — the system works without cache, just slower |
| **BullMQ** | Failed jobs retry once after 3s, then marked as failed |
| **Docker** | Timeout kills the process, network isolated, memory capped |
