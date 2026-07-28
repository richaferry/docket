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

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

export { sqlite };
