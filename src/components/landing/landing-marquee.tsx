const names = [
  "Wren & Kite Studio",
  "Osamu Tanaka Atelier",
  "Meridian Architecture",
  "Vela & Pine Illustration",
  "North Loop Design",
  "Fable & Fox",
  "Casa Alba",
  "Fieldnote Creative",
];

function Half({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {names.map((name) => (
        <span
          key={name}
          className="mr-16 whitespace-nowrap font-display text-2xl italic tracking-tight text-ink/40"
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export function LandingMarquee() {
  return (
    <section className="border-y border-line py-12">
      <p className="mx-auto mb-9 max-w-7xl px-4 text-center font-mono text-xs uppercase tracking-[0.2em] text-ink-muted sm:px-6 lg:px-8">
        Workspaces started by independent practices
      </p>
      <div className="marquee overflow-hidden" aria-hidden="true">
        <div className="marquee-track flex w-max">
          <Half />
          <Half hidden />
        </div>
      </div>
    </section>
  );
}
