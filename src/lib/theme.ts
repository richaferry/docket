import { cookies } from "next/headers";

export type ThemePref = "light" | "dark" | "system";

export const THEME_COOKIE = "theme";

// Server-side read of the theme preference so the initial HTML (icon included)
// matches what the visitor chose, avoiding the flash of the wrong icon after
// hydration. Reading a cookie in a component opts the route into dynamic
// rendering, which the landing page needs for a correct first paint.
export async function getThemePref(): Promise<ThemePref> {
  const stored = (await cookies()).get(THEME_COOKIE)?.value;
  return stored === "light" || stored === "dark" ? stored : "system";
}
