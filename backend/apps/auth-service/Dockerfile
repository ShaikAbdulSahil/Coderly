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
COPY apps/auth-service/ ./apps/auth-service/

# Compile TypeScript
RUN cd apps/auth-service && npx tsc -p tsconfig.json

# ─── Stage 2: Run ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=builder /app/proto ./proto

# Proto accessible from compiled JS path (dist/src/ references ../../../proto)
COPY --from=builder /app/proto ./apps/proto

EXPOSE 50051

CMD ["node", "apps/auth-service/dist/main.js"]
