import { LandingNav } from "./landing-nav";
import { LandingHero } from "./landing-hero";
import { LandingMarquee } from "./landing-marquee";
import { LandingFeatures } from "./landing-features";
import { LandingWorkflow } from "./landing-workflow";
import { LandingCta } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

// The full landing page, reused by / and by the palette preview pages
// (/v1, /v2, /v3) so each palette can wrap it and override the theme tokens.
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
