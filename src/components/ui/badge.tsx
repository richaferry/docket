import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-neutral-soft text-ink-muted",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export const INVOICE_STATUS_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  sent: "accent",
  paid: "success",
  overdue: "danger",
  partial: "warning",
  cancelled: "neutral",
};

export const CLIENT_STATUS_TONE: Record<string, BadgeTone> = {
  lead: "warning",
  active: "success",
  archived: "neutral",
};
