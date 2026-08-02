import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";

export const metadata: Metadata = {
  title: "Docket — Invoicing for independent practices",
  description:
    "A quiet workspace for independent practices: numbered invoices, a line per client, and payment status in one place.",
};

export default function LandingPage() {
  return <Landing />;
}
