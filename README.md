<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/gRPC-244c5a?style=for-the-badge&logo=grpc&logoColor=white" alt="gRPC" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<h1 align="center">Coderly</h1>
<h3 align="center">An Online Code Execution Platform</h3>

<p align="center">
  <strong>Real-time code execution | Microservices Architecture | Sandboxed Containers</strong>
</p>

---

## About This Project

Hi! I'm Sahil, and this is **Coderly** — a full-stack coding challenge platform I built to learn about distributed systems, real-time communication, and secure code execution.

The idea is simple: users can browse coding problems, write solutions in multiple programming languages, and get instant feedback as their code runs. The interesting part is *how* it works under the hood — I wanted to build something that could actually scale and handle untrusted code safely.

---

## What I Built

### Core Features

- **Multi-language Code Execution** — Supports Python, JavaScript, TypeScript, Java, C, and C++
- **Real-time Output Streaming** — See stdout/stderr as your code runs, not just after it finishes
- **Secure Sandboxing** — User code runs in isolated Docker containers with no network access
- **Problem Management** — Browse, filter, and solve coding challenges by difficulty and category
- **User Authentication** — JWT-based auth with secure password hashing
- **Progress Tracking** — Keep track of which problems you've solved

### Technical Features

- **Microservices Architecture** — 5 independent services that can be deployed and scaled separately
- **gRPC Communication** — Services talk to each other using Protocol Buffers over HTTP/2
- **Event-Driven Design** — Code execution is handled asynchronously via job queues
- **Multiple Databases** — PostgreSQL for users/submissions, MongoDB for problems, Redis for caching
- **WebSocket Streaming** — Live updates pushed to the browser during code execution

---

## Tech Stack

### Backend
| Technology | What I Used It For |
|------------|-------------------|
| **NestJS** | Framework for building the microservices — gave me dependency injection and good structure |
| **gRPC + Protobuf** | Communication between services — faster than REST and gives type safety |
| **BullMQ** | Job queue for handling code execution requests asynchronously |
| **PostgreSQL** | Storing user accounts, sessions, and submission records |
| **MongoDB** | Storing coding problems — the flexible schema works well for nested test cases |
| **Redis** | Caching API responses, backing the job queue, and pub/sub for real-time updates |
| **Docker** | Running user code in isolated containers so it can't harm the server |
| **Socket.io** | Pushing execution logs to the frontend in real-time |

### Frontend
| Technology | What I Used It For |
|------------|-------------------|
| **Next.js 16** | React framework with the new App Router for server components |
| **React 19** | Building the UI with the latest React features |
| **Redux Toolkit** | Managing auth state and real-time submission updates |
| **Monaco Editor** | The same editor VS Code uses — gives a great coding experience |
| **Tailwind CSS** | Styling everything quickly with utility classes |
| **Framer Motion** | Adding smooth animations to make the UI feel polished |

---

## Architecture

I designed this as a microservices system where each service has a single responsibility:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT                                      │
│                          Next.js Frontend (React)                            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                         HTTP/JSON │ WebSocket
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (:3000)                                │
│         The single entry point — handles REST, WebSockets, and caching       │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ gRPC
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MICROSERVICES                                   │
│                                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │Auth Service  │  │Problem Service│  │  Submission  │  │   Execution    │  │
│  │  (:50051)    │  │   (:50052)    │  │   Service    │  │    Engine      │  │
│  │              │  │               │  │  (:50053)    │  │   (:50054)     │  │
│  │ • Register   │  │ • List/CRUD   │  │              │  │                │  │
│  │ • Login      │  │ • Filter      │  │ • Create     │  │ • Process jobs │  │
│  │ • Validate   │  │ • Search      │  │ • Queue jobs │  │ • Run in Docker│  │
│  └──────────────┘  └───────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────────┐ │
│  │   PostgreSQL   │  │    MongoDB     │  │             Redis              │ │
│  │ Users/Sessions │  │   Problems     │  │  Cache + Queue + Pub/Sub       │ │
│  │  Submissions   │  │  (documents)   │  │                                │ │
│  └────────────────┘  └────────────────┘  └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
│  │  • coderly_auth  │  │ • coderly_       │  │  • API Response Cache      │ │
│  │    (users,       │  │   problems       │  │  • BullMQ Job Queues       │ │
│  │    sessions)     │  │   (documents)    │  │  • Pub/Sub for Results     │ │
│  │  • coderly_      │  │                  │  │  • Socket Session Registry │ │
│  │    submissions   │  │                  │  │                            │ │
│  └──────────────────┘  └──────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Redis: The Hidden Powerhouse

Redis serves **4 distinct purposes** in this architecture, showcasing its versatility:

### 1. API Response Caching
```typescript
// Problems are cached for 5 minutes to reduce MongoDB load
const cached = await redis.get(`problems:${category}:${difficulty}:${page}`);
if (cached) return JSON.parse(cached);
// ... fetch from DB and cache
await redis.setex(key, 300, JSON.stringify(result));
```

### 2. BullMQ Job Queue
```typescript
// Submissions are queued for async execution with retry logic
await executionQueue.add('execute', {
    submissionId,
    language: 'python',
    codeBody: userCode,
}, {
    attempts: 2,
    backoff: { type: 'fixed', delay: 3000 },
});
```

### 3. Pub/Sub for Real-Time Results
```typescript
// Execution Engine publishes results to the user's channel
await redis.publish(`coderly:result:${userId}`, JSON.stringify({
    submissionId,
    status: 'accepted',
    executionTimeMs: 42,
}));

// API Gateway subscribes and pushes to the correct WebSocket
subscriber.on('pmessage', (_, channel, message) => {
    const userId = channel.replace('coderly:result:', '');
    const socket = localSockets.get(userId);
    socket?.emit('submission:result', JSON.parse(message));
});
```

### 4. Distributed Socket Session Registry
```typescript
// Enables horizontal scaling of WebSocket servers
await redis.hset(`socket:user:${userId}`, {
    serverId: SERVER_ID,  // Which gateway replica holds the socket
    socketId: client.id,
});
```

---

## Code Execution Security

User code runs in **ephemeral Docker containers** with strict isolation:

```typescript
const containerConfig = {
    Image: 'python:3.11-slim',
    NetworkDisabled: true,      // No network access
    Memory: 256 * 1024 * 1024,  // 256MB RAM limit
    CpuQuota: 50000,            // 50% of one CPU core
    AutoRemove: true,           // Container deleted after execution
};
```

**Why this matters:**
- **Network isolation** prevents malicious code from making external requests
- **Memory limits** prevent fork bombs and memory exhaustion
- **CPU limits** prevent infinite loops from starving the host
- **Ephemeral containers** leave no trace after execution

---

## Real-Time Execution Flow

```
┌──────┐    ┌───────────┐    ┌────────────┐    ┌─────────────┐    ┌────────┐
│Client│    │API Gateway│    │ Submission │    │  Execution  │    │ Docker │
│      │    │           │    │  Service   │    │   Engine    │    │Container│
└──┬───┘    └─────┬─────┘    └──────┬─────┘    └──────┬──────┘    └────┬───┘
   │              │                 │                 │                │
   │ POST /submit │                 │                 │                │
   │─────────────>│                 │                 │                │
   │              │ gRPC: Create    │                 │                │
   │              │────────────────>│                 │                │
   │              │                 │ BullMQ Enqueue  │                │
   │              │                 │────────────────>│                │
   │              │ { submissionId }│                 │                │
   │<─────────────│<────────────────│                 │                │
   │              │                 │                 │                │
   │ WS: subscribe(submissionId)   │                 │                │
   │─────────────>│                 │                 │                │
   │              │                 │                 │ Spawn container│
   │              │                 │                 │───────────────>│
   │              │                 │                 │                │
   │              │                 │                 │<──── stdout ───│
   │              │<─────────────── gRPC Stream ─────│                │
   │<─ WS: log ───│                 │                 │                │
   │              │                 │                 │<──── result ───│
   │              │                 │                 │                │
   │              │<───── Redis Pub/Sub: result ─────│                │
   │<─ WS: done ──│                 │                 │                │
   │              │                 │                 │                │
```

---

## Project Structure

```
coderly/
├── backend/
│   ├── apps/
│   │   ├── api-gateway/          # REST + WebSocket entry point
│   │   │   └── src/
│   │   │       ├── auth/         # Auth routes + JWT guards
│   │   │       ├── execution/    # WebSocket gateway for logs
│   │   │       ├── problems/     # Problem CRUD routes
│   │   │       └── submissions/  # Submission routes
│   │   │
│   │   ├── auth-service/         # User auth microservice
│   │   │   └── src/
│   │   │       ├── auth/         # Registration, login, validation
│   │   │       ├── users/        # User repository
│   │   │       └── sessions/     # Session management
│   │   │
│   │   ├── problem-service/      # Problem catalog microservice
│   │   │   └── src/problems/     # CRUD + filtering
│   │   │
│   │   ├── submission-service/   # Submission tracking microservice
│   │   │   └── src/submissions/  # Create, queue, update status
│   │   │
│   │   └── execution-engine/     # Code execution microservice
│   │       └── src/
│   │           ├── execution/    # BullMQ processor
│   │           └── runner/       # Docker sandbox runner
│   │
│   ├── proto/
│   │   └── coderly.proto         # Shared gRPC contract
│   │
│   ├── migrations/               # PostgreSQL schema
│   └── docker-compose.yml        # Full stack orchestration
│
├── frontend/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Login/register pages
│   │   ├── (main)/               # Protected routes
│   │   │   ├── problems/         # Problem list + workspace
│   │   │   └── profile/          # User profile
│   │   └── actions/              # Server actions
│   │
│   ├── components/
│   │   ├── workspace/            # Code editor + output panel
│   │   ├── problems/             # Problem list components
│   │   └── nav/                  # Navigation
│   │
│   ├── lib/
│   │   ├── api.ts                # Type-safe API client
│   │   └── hooks/                # Custom React hooks
│   │
│   ├── store/                    # Redux state management
│   └── types/                    # Shared TypeScript interfaces
│
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

### 1. Start Infrastructure
```bash
cd backend
docker compose up -d redis postgres mongo
```

### 2. Start Backend Services
```bash
# In separate terminals (or use a process manager)
pnpm start:dev:auth
pnpm start:dev:problem
pnpm start:dev:submission
pnpm start:dev:execution
pnpm start:dev:gateway
```

### 3. Start Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

### 4. Open Browser
Navigate to `http://localhost:3001`

---

## Key Features

### For Users
- **Multi-language support**: Python, JavaScript, TypeScript, Java, C, C++
- **Real-time execution**: Watch stdout/stderr stream as code runs
- **Problem filtering**: By difficulty (Easy/Medium/Hard) and category
- **Progress tracking**: Solved problems persist across sessions

### For Engineers (Recruiter-Relevant)
- **Microservices**: 5 independently deployable services
- **gRPC**: Binary protocol with streaming for efficient inter-service calls
- **Event-driven**: BullMQ decouples submission from execution
- **Polyglot persistence**: Right database for each use case
- **Horizontal scaling**: Redis enables multi-instance WebSocket servers
- **Security**: Sandboxed execution with resource limits
- **Type safety**: End-to-end TypeScript with shared Protobuf contracts

---

## Design Decisions & Trade-offs

| Decision | Reasoning |
|----------|-----------|
| **gRPC over REST internally** | ~10x smaller payloads, streaming support, strict typing via Protobuf |
| **MongoDB for problems** | Nested templates and test cases fit document model better than relational |
| **PostgreSQL for auth/submissions** | ACID guarantees for financial-grade data integrity |
| **BullMQ over raw Redis** | Built-in retry, backoff, concurrency control, and dead-letter queues |
| **Socket.io over raw WebSockets** | Automatic reconnection, rooms, and fallback to polling |
| **Docker over direct execution** | Security isolation; the only safe way to run untrusted code |

---

## What I Learned Building This

1. **Distributed systems are hard** — Handling partial failures, eventual consistency, and debugging across services requires careful logging and tracing.

2. **gRPC streaming is powerful** — Server-side streaming lets the Execution Engine push log lines as they happen, not after execution completes.

3. **Redis is incredibly versatile** — One technology serving as cache, queue backend, pub/sub broker, and session store.

4. **Security is non-negotiable** — Running user code requires paranoid isolation. Network=none + resource limits + ephemeral containers.

5. **Type safety pays off** — Protobuf contracts catch breaking changes at compile time across service boundaries.

---

## Future Improvements

- [ ] Kubernetes deployment with Helm charts
- [ ] Distributed tracing with Jaeger/OpenTelemetry
- [ ] Rate limiting per user with Redis sliding window
- [ ] Problem submission history with diff viewer
- [ ] Collaborative coding with operational transforms

---

## License

MIT — Built by **Sahil** as a portfolio project demonstrating production-grade engineering practices.
