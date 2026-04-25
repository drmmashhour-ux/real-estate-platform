import type { Metadata } from "next";
import { PsychologyPageClient } from "@/components/demo/PsychologyPageClient";

export const metadata: Metadata = {
  title: "Psychologie courtier Québec | LECIPM",
  description:
    "Ce qui compte pour les courtiers québécois, leurs peurs, ce qui déclenche un oui, formulation de positionnement et repères live en démo.",
};

export default function MarketingPsychologyPage() {
  return <PsychologyPageClient />;
}
