import { db } from "@/db";
import { settings } from "@/db/schema";
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

// A tenant's workspace is set up once its settings row has a business name.
// register() creates the tenant without a settings row; setupWorkspace() fills
// it in. A session alone isn't enough — the user must complete the workspace
// step before the dashboard opens.
export async function isTenantOnboarded(tenantId: string): Promise<boolean> {
  const rows = await db
    .select({ businessName: settings.businessName })
    .from(settings)
    .where(eq(settings.tenantId, tenantId))
    .limit(1);
  const row = rows[0];
  return Boolean(row?.businessName?.trim());
}
