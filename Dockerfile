# ─── Build stage ───────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/ 2>/dev/null || true

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

# ─── Production stage ───────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

RUN npm install -g pnpm

# Copy package files and install production deps only
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/ 2>/dev/null || true
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# Start
CMD ["node", "dist/index.js"]
