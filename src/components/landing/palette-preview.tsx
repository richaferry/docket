import Link from "next/link";
import { cn } from "@/lib/utils";

const VERSIONS = [
  { id: "v1", href: "/v1", label: "V1 · Warm" },
  { id: "v2", href: "/v2", label: "V2 · Sky" },
  { id: "v3", href: "/v3", label: "V3 · Sage" },
] as const;

export type PaletteId = (typeof VERSIONS)[number]["id"];

// Preview wrapper for the alternative palette pages. Sets a data-palette
// attribute whose CSS variables override the default theme for this subtree,
// and adds a floating switcher so the palettes are easy to compare.
export function PalettePreview({
  palette,
  children,
}: {
  palette: PaletteId;
  children: React.ReactNode;
}) {
  return (
    <div data-palette={palette} className="min-h-screen bg-paper text-ink">
      {children}
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-line bg-paper-raised p-1 shadow-[0_16px_40px_-16px_rgba(22,48,63,0.4)]">
        {VERSIONS.map((version) => (
          <Link
            key={version.id}
            href={version.href}
            aria-current={palette === version.id ? "page" : undefined}
            title={`${version.label} palette`}
            className={cn(
              "rounded-full px-3 py-1.5 font-mono text-xs transition-colors",
              palette === version.id
                ? "bg-accent-soft text-accent"
                : "text-ink-muted hover:bg-neutral-soft hover:text-ink",
            )}
          >
            {version.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
