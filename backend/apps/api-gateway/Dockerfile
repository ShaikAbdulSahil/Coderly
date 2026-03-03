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
COPY apps/api-gateway/ ./apps/api-gateway/

# Compile TypeScript
RUN cd apps/api-gateway && npx tsc -p tsconfig.json

# ─── Stage 2: Run ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder /app/proto ./proto

# Proto accessible from compiled JS path (dist/src/ references ../../../../proto)
COPY --from=builder /app/proto ./apps/proto

EXPOSE 3000

CMD ["node", "apps/api-gateway/dist/main.js"]
