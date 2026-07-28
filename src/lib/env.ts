// Where the app is reachable from the internet — used to build the
// client-facing invoice link in emails. Configured via .env rather than the
// Settings UI since it's server/deployment config, not workspace data.
export function getPublicUrl(): string | null {
  const raw = process.env.PUBLIC_URL;
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}
