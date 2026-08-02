import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { LandingMarquee } from "./landing-marquee";
import { LandingFeatures } from "./landing-features";
import { LandingWorkflow } from "./landing-workflow";
import { LandingCta } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

// The full landing page, composed here so it can be wrapped or extended
// (e.g. by a different header) without duplicating section markup.
export function Landing() {
  return (
    <>
      <div aria-hidden="true" className="bg-noise pointer-events-none fixed inset-0 z-50 opacity-[0.04]" />
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <LandingHero />
        <LandingMarquee />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingCta />
      </main>
      <LandingFooter />
    </>
  );
}
