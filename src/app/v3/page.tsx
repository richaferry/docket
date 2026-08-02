import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { PalettePreview } from "@/components/landing/palette-preview";

export const metadata: Metadata = {
  title: "Docket — Sage palette (v3)",
};

export default function V3Page() {
  return (
    <PalettePreview palette="v3">
      <Landing />
    </PalettePreview>
  );
}
