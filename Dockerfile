# ----------
# Dependencies
# ----------
FROM node:24-bookworm-slim AS deps
WORKDIR /app

# Build essentials so better-sqlite3 can compile from source as a fallback
# when no prebuilt binary matches the runtime/arch.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# ----------
# Build the app (Next.js standalone output)
# ----------
FROM node:24-bookworm-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ----------
# Production runtime (self-contained, runs as non-root)
# ----------
FROM node:24-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The runtime user needs a writable data directory for the SQLite database.
RUN mkdir -p /app/data && chown -R node:node /app

# Standalone output + static assets + public files + SQLite migrations.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
# better-sqlite3 loads its prebuilt .node binary via a dynamic path at
# runtime, so ship the full package to be safe.
COPY --from=builder --chown=node:node /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

USER node
EXPOSE 3000

CMD ["node", "server.js"]
