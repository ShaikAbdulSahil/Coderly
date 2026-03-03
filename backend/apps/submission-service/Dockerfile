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
COPY apps/submission-service/ ./apps/submission-service/

# Compile TypeScript
RUN cd apps/submission-service && npx tsc -p tsconfig.json

# ─── Stage 2: Run ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/submission-service/dist ./apps/submission-service/dist
COPY --from=builder /app/proto ./proto

# Proto accessible from compiled JS path (dist/src/ references ../../../proto)
COPY --from=builder /app/proto ./apps/proto

EXPOSE 50053

CMD ["node", "apps/submission-service/dist/main.js"]
