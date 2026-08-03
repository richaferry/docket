// Creates or updates a platform superadmin. There is deliberately no
// self-serve signup for operators — access to the /admin area is provisioned
// from here (or the production DB console).
//
// Usage: npm run admin:create -- you@docket.app
//        (prompts for a password)   or
//        ADMIN_EMAIL=you@docket.app ADMIN_PASSWORD=... npm run admin:create
import { existsSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline/promises";
import { Pool } from "pg";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required to create a superadmin.");
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL ?? process.argv[2])?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run admin:create -- you@docket.app");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question("Password (min 8 chars): ");
  rl.close();
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

// Mirrors hashPassword() in src/lib/auth.ts: "salt:derived", salt is 16
// random bytes hex, derived is 64 bytes scrypt.
const salt = randomBytes(16).toString("hex");
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

const pool = new Pool({ connectionString: url });
const id = `sa-${randomBytes(12).toString("hex")}`;

try {
  const existing = await pool.query("SELECT 1 FROM superadmins WHERE email = $1", [email]);
  await pool.query(
    `INSERT INTO superadmins (id, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [id, email, passwordHash],
  );
  console.log(existing.rowCount ? `Updated superadmin ${email}.` : `Created superadmin ${email}.`);
} finally {
  await pool.end();
}
