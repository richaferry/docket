import { Reveal } from "./reveal";
import { SectionKicker } from "./styles";

const steps = [
  {
    n: "01",
    title: "Set up your workspace",
    body: "One form — business name, email, a password. You're in, with no card and no call.",
    tag: "about two minutes",
  },
  {
    n: "02",
    title: "Add clients, send invoices",
    body: "Invoice numbers are handled for you. PDFs render from your brand, and a shared link goes out in one click.",
    tag: "numbering on us",
  },
  {
    n: "03",
    title: "Mark paid, track the lag",
    body: "A timeline per client, the outstanding at a glance, and your average time to paid in the open.",
    tag: "status at a glance",
  },
];

export function LandingWorkflow() {
  return (
    <section id="workflow" className="scroll-mt-20 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionKicker>How it works</SectionKicker>
          <h2 className="mt-5 max-w-[18ch] font-display text-4xl leading-[1.02] tracking-tighter text-ink sm:text-5xl">
            From zero to first invoice in one sitting.
          </h2>
        </Reveal>

        <ol className="mt-14">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 80}>
              <li className="grid grid-cols-1 gap-3 border-t border-line py-9 md:grid-cols-[6rem_1fr_auto] md:gap-8 md:py-12">
                <span className="font-mono text-sm text-accent">{step.n}</span>
                <div>
                  <h3 className="font-display text-2xl tracking-tight text-ink">{step.title}</h3>
                  <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-ink-muted">
                    {step.body}
                  </p>
                </div>
                <span className="hidden self-start pt-1 font-mono text-xs uppercase tracking-[0.16em] text-ink-muted md:block">
                  {step.tag}
                </span>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
