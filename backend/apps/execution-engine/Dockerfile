# ─── Stage 1: Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (layer-cached)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy shared config & proto
COPY tsconfig.json ./
COPY proto/ ./proto/

# Copy service source
COPY apps/execution-engine/ ./apps/execution-engine/

# Compile TypeScript
RUN cd apps/execution-engine && npx tsc -p tsconfig.json

# ─── Stage 2: Run ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install Docker CLI so the execution engine can spawn code-runner containers
RUN apk add --no-cache docker-cli

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/execution-engine/dist ./apps/execution-engine/dist
COPY --from=builder /app/proto ./proto

# Proto accessible from compiled JS path (dist/src/ references ../../../proto)
COPY --from=builder /app/proto ./apps/proto

EXPOSE 50054

CMD ["node", "apps/execution-engine/dist/main.js"]
