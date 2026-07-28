import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-line px-8 py-6",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl text-ink">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
