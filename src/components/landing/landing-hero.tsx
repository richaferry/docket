import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ghostCta, primaryCta } from "./styles";

const stats = [
  { value: "312", label: "invoices sent" },
  { value: "$187,442", label: "billed this year" },
  { value: "9.6 days", label: "avg. time to paid" },
];

const lineItems = [
  { desc: "Brand identity — wordmark & palette", qty: "1×", amount: "$2,850.00" },
  { desc: "Editorial illustrations — 12 pieces", qty: "12×", amount: "$4,620.00" },
  { desc: "Type system — three weights", qty: "3×", amount: "$1,160.00" },
];

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-5 translate-y-6 rounded-[1.75rem] border border-line bg-paper-raised/70"
      />

      <div
        className="anim-float absolute -right-3 -top-7 z-10 flex items-center gap-2 rounded-full border border-line bg-paper-raised px-4 py-2 shadow-[0_14px_34px_-14px_rgba(33,29,22,0.4)]"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-paper-raised">
          <Check size={12} strokeWidth={3} aria-hidden="true" />
        </span>
        <span className="text-xs font-medium text-ink">Payment received · $8,630.00</span>
      </div>

      <div
        className="anim-float absolute -bottom-7 -left-5 z-10 flex items-center gap-3 rounded-2xl border border-line bg-paper-raised px-4 py-3 shadow-[0_14px_34px_-14px_rgba(33,29,22,0.4)]"
        style={{ animationDelay: "1.4s" }}
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent"
        >
          OT
        </span>
        <span className="text-xs leading-tight">
          <span className="block font-medium text-ink">Osamu Tanaka</span>
          <span className="block text-ink-muted">paid 2h ago · Osaka</span>
        </span>
      </div>

      <div className="relative rounded-[1.75rem] border border-line bg-paper-raised p-7 shadow-[0_40px_80px_-30px_rgba(33,29,22,0.35)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Docket</p>
            <p className="mt-1 font-display text-xl tracking-tight text-ink">Vela &amp; Pine Illustration</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-ink">INV-0481</p>
            <p className="mt-1 text-xs text-ink-muted">Aug 12, 2026</p>
          </div>
        </div>

        <div className="mt-7">
          {lineItems.map((item) => (
            <div
              key={item.desc}
              className="flex items-baseline justify-between gap-4 border-t border-line py-3 text-sm"
            >
              <span className="text-ink">{item.desc}</span>
              <span className="shrink-0 font-mono text-xs text-ink-muted">{item.qty}</span>
              <span className="shrink-0 font-mono text-ink">{item.amount}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-line pt-5">
          <span className="text-xs uppercase tracking-wide text-ink-muted">Total</span>
          <span className="font-mono text-2xl tracking-tight text-ink">$8,630.00</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-success">
            <span className="anim-breathe inline-block h-2 w-2 rounded-full bg-success" />
            Paid
          </span>
          <span className="font-mono text-xs text-ink-muted">#48</span>
        </div>
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 -top-40 h-[34rem] w-[34rem] rounded-full bg-accent-soft/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-56 top-1/2 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="mx-auto grid min-h-[100dvh] max-w-7xl grid-cols-1 items-center gap-16 px-4 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-8 lg:py-12">
        <div>
          <p
            className="anim-rise font-mono text-xs uppercase tracking-[0.2em] text-accent"
            style={{ animationDelay: "60ms" }}
          >
            Invoicing for independent practices
          </p>
          <h1
            className="anim-rise mt-6 font-display text-5xl leading-[0.95] tracking-tighter text-ink sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "140ms" }}
          >
            Send invoices your clients actually read.
          </h1>
          <p
            className="anim-rise mt-7 max-w-[52ch] text-lg leading-relaxed text-ink-muted"
            style={{ animationDelay: "220ms" }}
          >
            Docket is a quiet workspace for independent practices — numbered
            invoices, a line per client, and payment status in one place. No
            spreadsheet tetris, no billing-suite bloat.
          </p>
          <div className="anim-rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "300ms" }}>
            <Link href="/register" className={primaryCta}>
              Start free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="#features" className={ghostCta}>
              See how it works
            </Link>
          </div>
          <dl
            className="anim-rise mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-7"
            style={{ animationDelay: "380ms" }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-mono text-xl tracking-tight text-ink">{stat.value}</dd>
                <dd className="mt-1.5 text-xs leading-relaxed text-ink-muted">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="anim-rise pb-10 pt-4 sm:pb-14" style={{ animationDelay: "260ms" }}>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
