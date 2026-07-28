import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type Settings = typeof settings.$inferSelect;

let cached: Settings | null = null;

export function getSettings(): Settings {
  if (cached) return cached;

  const existing = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (existing) {
    cached = existing;
    return existing;
  }

  const authSecret = randomBytes(32).toString("hex");
  db.insert(settings).values({ id: 1, authSecret }).run();
  const created = db.select().from(settings).where(eq(settings.id, 1)).get()!;
  cached = created;
  return created;
}

export function updateSettings(patch: Partial<Omit<Settings, "id" | "authSecret">>): Settings {
  getSettings();
  db.update(settings).set(patch).where(eq(settings.id, 1)).run();
  cached = null;
  return getSettings();
}

export function invalidateSettingsCache() {
  cached = null;
}

export function isOnboarded(): boolean {
  const s = getSettings();
  return Boolean(s.adminEmail && s.adminPasswordHash);
}
