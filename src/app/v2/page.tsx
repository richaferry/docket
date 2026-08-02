import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { PalettePreview } from "@/components/landing/palette-preview";

export const metadata: Metadata = {
  title: "Docket — Sky palette (v2)",
};

export default function V2Page() {
  return (
    <PalettePreview palette="v2">
      <Landing />
    </PalettePreview>
  );
}
