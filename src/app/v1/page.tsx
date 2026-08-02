import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { PalettePreview } from "@/components/landing/palette-preview";

export const metadata: Metadata = {
  title: "Docket — Warm palette (v1)",
};

export default function V1Page() {
  return (
    <PalettePreview palette="v1">
      <Landing />
    </PalettePreview>
  );
}
