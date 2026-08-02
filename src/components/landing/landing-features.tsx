import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { SectionKicker } from "./styles";

const invoiceSnippet = [
  { desc: "Identity system — logo & palette", amount: "$2,850.00" },
  { desc: "Website — five pages", amount: "$4,600.00" },
  { desc: "Motion — launch reel", amount: "$980.00" },
];

const clients = [
  { name: "Wren & Kite Studio", amount: "$1,284.50", status: "paid" as const },
  { name: "Meridian Architecture", amount: "$4,020.00", status: "sent" as const },
  { name: "Casa Alba", amount: "$860.00", status: "overdue" as const },
];

const statusStyles: Record<
  string,
  { dot: string; label: string; text: string }
> = {
  paid: { dot: "bg-success", label: "Paid", text: "text-success" },
  sent: { dot: "bg-warning", label: "Sent", text: "text-warning" },
  overdue: { dot: "bg-danger", label: "Overdue", text: "text-danger" },
};

const months = [
  { period: "Aug 25", total: "$4,120" },
  { period: "Sep 25", total: "$6,880" },
  { period: "Oct 25", total: "$5,240" },
  { period: "Nov 25", total: "$9,310" },
  { period: "Dec 25", total: "$7,655" },
  { period: "Jan 26", total: "$6,180" },
  { period: "Feb 26", total: "$8,240" },
  { period: "Mar 26", total: "$7,940" },
];

const swatches = [
  { name: "Accent", className: "bg-accent" },
  { name: "Ink", className: "bg-ink" },
  { name: "Line", className: "bg-line" },
];

function MonthsHalf({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {months.map((month) => (
        <span key={month.period} className="mr-12 flex items-center whitespace-nowrap font-mono text-sm">
          <span className="text-ink-muted">{month.period}</span>
          <span className="mx-3 text-line">/</span>
          <span className="text-ink">{month.total}</span>
        </span>
      ))}
    </div>
  );
}

function Tile({
  kicker,
  className,
  children,
}: {
  kicker: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-[1.75rem] border border-line bg-paper-raised p-8",
        className,
      )}
    >
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">{kicker}</p>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionKicker>The workspace</SectionKicker>
          <h2 className="mt-5 max-w-[20ch] font-display text-4xl leading-[1.02] tracking-tighter text-ink sm:text-5xl">
            Run the money side without the software feel.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
          <Reveal className="flex">
            <Tile kicker="01 · Invoices" className="w-full">
              <div className="rounded-2xl border border-line bg-paper p-5">
                {invoiceSnippet.map((item) => (
                  <div
                    key={item.desc}
                    className="flex items-baseline justify-between gap-4 border-b border-line py-3 text-sm last:border-b-0"
                  >
                    <span className="text-ink">{item.desc}</span>
                    <span className="shrink-0 font-mono text-ink">{item.amount}</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="anim-breathe inline-block h-2 w-2 rounded-full bg-success" />
                    Paid
                  </span>
                  <span className="font-mono text-xs text-ink-muted">INV-0481</span>
                </div>
              </div>
              <div className="mt-7">
                <h3 className="font-display text-2xl tracking-tight text-ink">
                  Numbered, on-brand, PDF-ready.
                </h3>
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
                  Every invoice gets a number, carries your business name, and
                  opens as a clean PDF. One click sends a client-friendly link.
                </p>
              </div>
            </Tile>
          </Reveal>

          <Reveal delay={90} className="flex">
            <Tile kicker="02 · Clients" className="w-full">
              <ul className="flex flex-1 flex-col justify-center">
                {clients.map((client, index) => {
                  const status = statusStyles[client.status];
                  return (
                    <li
                      key={client.name}
                      className="flex items-center justify-between gap-4 border-t border-line py-5 first:border-t-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{client.name}</p>
                        <p className="mt-1 font-mono text-xs text-ink-muted">{client.amount}</p>
                      </div>
                      <span className={cn("flex items-center gap-2 text-xs font-medium", status.text)}>
                        <span
                          className={cn("anim-breathe inline-block h-2 w-2 rounded-full", status.dot)}
                          style={{ animationDelay: `${index * 300}ms` }}
                        />
                        {status.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-7">
                <h3 className="font-display text-2xl tracking-tight text-ink">
                  One quiet line per client.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Names, open invoices, last activity — a running timeline
                  instead of a drawer of folders.
                </p>
              </div>
            </Tile>
          </Reveal>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.55fr]">
          <Reveal className="flex">
            <Tile kicker="03 · Brand" className="w-full">
              <div className="flex flex-1 flex-col justify-center rounded-2xl border border-line bg-paper p-6">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
                  Business name
                </p>
                <p className="mt-3 font-display text-3xl tracking-tight text-ink">
                  Fieldnote Creative
                </p>
                <div className="mt-6 flex gap-2">
                  {swatches.map((swatch) => (
                    <span
                      key={swatch.name}
                      title={swatch.name}
                      className={cn("h-8 w-8 rounded-full border border-line", swatch.className)}
                    />
                  ))}
                </div>
                <p className="mt-4 font-mono text-xs text-ink-muted">
                  Set once — follows onto every invoice.
                </p>
              </div>
              <div className="mt-7">
                <h3 className="font-display text-2xl tracking-tight text-ink">
                  Your name on every page.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Your business name, set once, appears on invoices, client
                  links, and payment emails.
                </p>
              </div>
            </Tile>
          </Reveal>

          <Reveal delay={90} className="flex">
            <Tile kicker="04 · Payments" className="w-full">
              <div className="marquee flex flex-1 items-center overflow-hidden rounded-2xl border border-line bg-paper">
                <div className="marquee-track-fast flex w-max">
                  <MonthsHalf />
                  <MonthsHalf hidden />
                </div>
              </div>
              <div className="mt-7">
                <h3 className="font-display text-2xl tracking-tight text-ink">
                  Watch the lag drop.
                </h3>
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
                  Mark paid, keep the outstanding in view, and see your average
                  time to paid move month over month.
                </p>
              </div>
            </Tile>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
