import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { getDatabaseUrl } from "@/lib/env";

// Single shared connection pool for the whole app. `pg` speaks standard TCP,
// so the same code runs against local/Docker Postgres and Neon (which accepts
// ordinary Postgres connections). Queries are async (unlike the old
// better-sqlite3 sync API), so every call site awaits.
const pool = new Pool({ connectionString: getDatabaseUrl() });

export const db = drizzle(pool, { schema });

export { pool };
