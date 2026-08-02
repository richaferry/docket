import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { primaryCta } from "./styles";

export function LandingCta() {
  return (
    <section className="pb-24 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-paper-raised px-6 py-16 text-center sm:px-12 lg:py-24">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-soft/70 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Open signup
              </p>
              <h2 className="mt-6 font-display text-4xl leading-[1.02] tracking-tighter text-ink sm:text-6xl">
                Two minutes from here to your first invoice.
              </h2>
              <p className="mx-auto mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-muted">
                Set up with an email and a password. No card, no waiting list,
                no sales call.
              </p>
              <div className="mt-9">
                <Link href="/register" className={primaryCta}>
                  Start your workspace
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
