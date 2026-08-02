# ----------
# Dependencies
# ----------
FROM node:24-bookworm-slim AS deps
WORKDIR /app

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

RUN chown -R node:node /app

# Standalone output + static assets + public files + Postgres migrations and
# the migration runner that applies them on startup.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts ./scripts
# Turbopack inlines drizzle-orm into the server bundle, so the pruned
# standalone node_modules omits it — but scripts/migrate.mjs runs unbundled
# and needs the package (it has no runtime deps of its own; pg is already
# shipped for the traced app).
COPY --from=builder --chown=node:node /app/node_modules/drizzle-orm ./node_modules/drizzle-orm

USER node
EXPOSE 3000

CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
