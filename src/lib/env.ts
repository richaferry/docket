// Where the app is reachable from the internet — used to build the
// client-facing invoice link in emails. Configured via .env rather than the
// Settings UI since it's server/deployment config, not workspace data.
export function getPublicUrl(): string | null {
  const raw = process.env.PUBLIC_URL;
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

// Postgres connection string (Neon pooled URL in production, a local or
// container Postgres in dev). Defaults to a local Postgres so the module can
// load without configuration; actual queries still require a reachable DB.
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
}
