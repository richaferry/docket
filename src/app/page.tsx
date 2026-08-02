import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingMarquee } from "@/components/landing/landing-marquee";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingWorkflow } from "@/components/landing/landing-workflow";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata: Metadata = {
  title: "Docket — Invoicing for independent practices",
  description:
    "A quiet workspace for independent practices: numbered invoices, a line per client, and payment status in one place.",
};

export default function LandingPage() {
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
