import { db } from "@/db";
import { settings, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Settings = typeof settings.$inferSelect;

const cache = new Map<string, Settings>();

export async function getSettings(tenantId: string): Promise<Settings> {
  const cached = cache.get(tenantId);
  if (cached) return cached;

  const existing = await db
    .select()
    .from(settings)
    .where(eq(settings.tenantId, tenantId))
    .limit(1);
  const row = existing[0];
  if (row) {
    cache.set(tenantId, row);
    return row;
  }

  // A tenant is created (setup/register) without a settings row; the first
  // read backfills one. onConflictDoNothing keeps concurrent first-reads from
  // racing — the losers just re-select the winner's row.
  await db
    .insert(settings)
    .values({ tenantId })
    .onConflictDoNothing();
  const created = await db
    .select()
    .from(settings)
    .where(eq(settings.tenantId, tenantId))
    .limit(1);
  const fresh = created[0]!;
  cache.set(tenantId, fresh);
  return fresh;
}

export async function updateSettings(
  tenantId: string,
  patch: Partial<Omit<Settings, "id" | "tenantId">>,
): Promise<Settings> {
  await getSettings(tenantId);
  await db.update(settings).set(patch).where(eq(settings.tenantId, tenantId));
  cache.delete(tenantId);
  return getSettings(tenantId);
}

// Onboarding has happened once at least one tenant exists.
export async function isOnboarded(): Promise<boolean> {
  const rows = await db.select({ id: tenants.id }).from(tenants).limit(1);
  return rows.length > 0;
}
