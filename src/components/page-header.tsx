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
        "flex flex-col gap-4 border-b border-line px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{eyebrow}</p>
        )}
        <h1 className="font-display text-xl text-ink sm:text-2xl">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
