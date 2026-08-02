import { getThemePref } from "@/lib/theme";
import { ThemeToggleMenu } from "./theme-toggle-menu";

// Server component: reads the visitor's theme preference from a cookie so the
// icon (and colors) are correct in the initial HTML, with no flash after
// hydration. Renders a client dropdown menu.
export async function ThemeToggle({
  className,
  menuAlign = "right",
}: {
  className?: string;
  menuAlign?: "left" | "right";
}) {
  const initialPref = await getThemePref();
  return <ThemeToggleMenu initialPref={initialPref} className={className} menuAlign={menuAlign} />;
}
