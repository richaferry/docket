import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
// Owner-only: this directory holds the SQLite file with the admin password
// hash and plaintext SMTP/MailAnvil secrets. Default OS permissions would
// otherwise leave it readable by other local users on a shared host.
try {
  fs.chmodSync(dataDir, 0o700);
} catch {
  // Not fatal (e.g. read-only filesystem, or permissions already correct) —
  // don't block startup over a best-effort hardening step.
}

const dbPath = path.join(dataDir, "app.db");
const sqlite = new Database(dbPath);
try {
  fs.chmodSync(dbPath, 0o600);
} catch {
  // Same as above — best effort.
}
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
// Give concurrent writers (e.g. `next build` worker processes or multiple
// container replicas) a chance to queue behind each other instead of failing
// instantly with SQLITE_BUSY.
sqlite.pragma("busy_timeout = 10000");

export const db = drizzle(sqlite, { schema });

const migrationsFolder = path.join(process.cwd(), "drizzle");

// Drizzle's migrator is check-then-run: it reads the last applied migration,
// then executes every newer one in a transaction. When several processes
// import this module at once against a fresh database (Next.js runs page-data
// collection across many workers), two can read "nothing applied" and race to
// CREATE the same table — the loser fails with "table already exists". The
// winner's transaction commits, so a short retry loop sees the updated state
// and skips straight past. This only retries genuine concurrency conflicts.
function runMigrations() {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      migrate(db, { migrationsFolder });
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isConflict = /already exists|SQLITE_BUSY|database is locked|is locked/i.test(message);
      if (!isConflict) throw err;
      const waitMs = 250 * attempt;
      const deadline = Date.now() + waitMs;
      while (Date.now() < deadline) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, deadline - Date.now());
      }
    }
  }
  throw new Error(`Migrations did not complete after ${maxAttempts} attempts`);
}

runMigrations();

export { sqlite };
