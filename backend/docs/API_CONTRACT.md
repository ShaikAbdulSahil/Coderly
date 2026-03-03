# Coderly API Contract

> Base URL: `http://localhost:3000/api`

---

## Authentication

### `POST /auth/register`

Create a new user account.

**Request:**
```json
{
  "username": "sahil",
  "email": "sahil@coderly.dev",
  "password": "securepass123"
}
```

**Validation:**
- `username` — required, min 3 characters
- `email` — required, valid email format
- `password` — required, min 6 characters

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Error (400):**
```json
{ "statusCode": 400, "message": "Email is already registered" }
```

---

### `POST /auth/login`

Authenticate and receive a JWT.

**Request:**
```json
{
  "email": "sahil@coderly.dev",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "sahil"
}
```

**Error (401):**
```json
{ "statusCode": 401, "message": "Invalid email or password" }
```

---

### `GET /auth/me`

Get current authenticated user info.

**Headers:** `Authorization: Bearer <JWT>`

**Response (200):**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "sahil"
}
```

---

## Problems

### `GET /problems`

List problems with optional filters and pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| category | string | — | Filter by category (case-insensitive) |
| difficulty | string | — | Filter: "Easy", "Medium", "Hard" |
| page | int | 1 | Page number |
| limit | int | 10 | Items per page (max 50) |

**Example:** `GET /problems?category=sliding-window&difficulty=Medium&page=1&limit=5`

**Response (200):**
```json
{
  "problems": [
    {
      "id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "title": "Longest Substring Without Repeating Characters",
      "slug": "longest-substring",
      "difficulty": "Medium",
      "category": "Sliding Window",
      "description": "Given a string s, find the length of...",
      "templates": [
        { "language": "python", "code": "def lengthOfLongestSubstring(s: str) -> int:\n    pass" },
        { "language": "javascript", "code": "var lengthOfLongestSubstring = function(s) { };" }
      ],
      "test_cases": [
        { "input": "abcabcbb", "expected": "3" },
        { "input": "bbbbb", "expected": "1" }
      ],
      "constraints": ["s.length <= 50000"]
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 5
}
```

---

### `GET /problems/:id`

Get a single problem by ID.

**Response (200):** Single problem object (same shape as list item above)

**Error (404):**
```json
{ "statusCode": 404, "message": "Problem \"abc123\" not found" }
```

---

### `POST /problems`

Create a new problem.

**Request:**
```json
{
  "title": "Two Sum",
  "slug": "two-sum",
  "difficulty": "Easy",
  "category": "Arrays",
  "description": "Given an array of integers nums...",
  "templates": [
    { "language": "python", "code": "def twoSum(nums, target):\n    pass" }
  ],
  "test_cases": [
    { "input": "[2,7,11,15], 9", "expected": "[0,1]" }
  ],
  "constraints": ["2 <= nums.length <= 10^4"]
}
```

**Response (201):** Created problem object

**Error (409):**
```json
{ "statusCode": 409, "message": "A problem with slug \"two-sum\" already exists" }
```

---

### `PUT /problems/:id`

Partial update — only include fields you want to change.

**Request:**
```json
{
  "difficulty": "Medium",
  "description": "Updated description..."
}
```

**Response (200):** Updated problem object

---

### `DELETE /problems/:id`

Delete a problem.

**Response (200):**
```json
{ "success": true, "message": "Problem deleted successfully" }
```

---

## Submissions

> All submission routes require `Authorization: Bearer <JWT>`

### `POST /submissions`

Submit code for execution.

**Request:**
```json
{
  "problemId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "language": "python",
  "codeBody": "def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target-n], i]\n        seen[n] = i"
}
```

**Supported languages:** `python`, `javascript`, `typescript`, `java`, `cpp`, `c`

**Response (201):**
```json
{
  "success": true,
  "message": "Submission queued for execution",
  "submission": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "problem_id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "language": "python",
    "code_body": "...",
    "status": "pending",
    "execution_time": 0,
    "memory_used": 0,
    "created_at": "2026-02-24T17:30:00.000Z"
  }
}
```

---

### `GET /submissions/:id`

Get a submission by ID.

**Response (200):** Single submission object (status may be: `pending`, `running`, `accepted`, `wrong_answer`, `error`)

---

### `GET /submissions/user/me`

Get all your submissions, newest first.

**Query:** `?page=1&limit=10`

**Response (200):**
```json
{
  "submissions": [ /* array of submission objects */ ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

## WebSocket — Execution Logs

### Connection

```
ws://localhost:3000/execution?token=<JWT>
```

Or via Socket.io:
```javascript
const socket = io('http://localhost:3000/execution', {
  auth: { token: 'your_jwt_here' }
});
```

### Events

| Direction | Event | Payload | Description |
|-----------|-------|---------|-------------|
| Client → Server | `execute:subscribe` | `{ submissionId: "uuid" }` | Start receiving logs |
| Server → Client | `execution:log` | `{ type, payload, submissionId }` | Log frame |
| Server → Client | `execution:complete` | `{ submissionId }` | Execution finished |
| Server → Client | `execution:error` | `{ submissionId, message }` | Stream error |
| Server → Client | `error` | `{ message }` | Auth error |

### LogFrame Types

| type | payload contains |
|------|-----------------|
| `status` | Human-readable status message |
| `stdout` | Program standard output |
| `stderr` | Program errors or warnings |
| `result` | JSON with final status, executionTimeMs |

### Result Payload Example
```json
{ "status": "accepted", "executionTimeMs": 42 }
```
```json
{ "status": "error", "reason": "Time Limit Exceeded", "executionTimeMs": 10000 }
```
