// Applies the Drizzle SQL migrations in ./drizzle to the configured
// database. Kept as a standalone runtime script (not a drizzle-kit command)
// so it can run from a production standalone image where drizzle-kit isn't
// installed. Used by `npm run db:migrate`, CI, and the container entrypoint.
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const url = process.env.DATABASE_URL;
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
