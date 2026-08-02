import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Settings = typeof settings.$inferSelect;

let cached: Settings | null = null;

export async function getSettings(): Promise<Settings> {
  if (cached) return cached;

  const existing = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  const row = existing[0];
  if (row) {
    cached = row;
    return row;
  }

  const authSecret = randomBytes(32).toString("hex");
  // Build-time prerendering runs several pages concurrently across workers;
  // each may find no row and race to insert. onConflictDoNothing keeps the
  // losers from crashing — they just re-select the winner's row.
  await db
    .insert(settings)
    .values({ id: 1, authSecret })
    .onConflictDoNothing();
  const created = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  cached = created[0]!;
  return cached;
}

export async function updateSettings(
  patch: Partial<Omit<Settings, "id" | "authSecret">>,
): Promise<Settings> {
  await getSettings();
  await db.update(settings).set(patch).where(eq(settings.id, 1));
  cached = null;
  return getSettings();
}

export function invalidateSettingsCache() {
  cached = null;
}

export async function isOnboarded(): Promise<boolean> {
  const s = await getSettings();
  return Boolean(s.adminEmail && s.adminPasswordHash);
}
