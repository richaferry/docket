// Applies the Drizzle SQL migrations in ./drizzle to the configured
// database. Kept as a standalone runtime script (not a drizzle-kit command)
// so it can run from a production standalone image where drizzle-kit isn't
// installed. Used by `npm run db:migrate`, CI, and the container entrypoint.
import { existsSync } from "node:fs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Plain `node` doesn't load .env the way Next.js does, so load it ourselves
// when present. In the container there is no .env — DATABASE_URL comes from
// the runtime environment instead.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

// Neon exposes a pooled URL (pgbouncer-style) and an unpooled one. Pooled
// connections can reject multi-statement DDL and advisory locks, so the
// migration runner prefers the unpooled URL when both are configured; the
// plain DATABASE_URL (used by local dev, Docker, and CI) remains the fallback.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

await migrate(db, {
  migrationsFolder: process.env.DATABASE_MIGRATIONS_DIR ?? "./drizzle",
});

await pool.end();
console.log("Migrations applied.");
