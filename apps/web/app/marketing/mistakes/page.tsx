import type { Metadata } from "next";
import { MistakesPageClient } from "@/components/demo/MistakesPageClient";

export const metadata: Metadata = {
  title: "Erreurs qui tuent les deals | LECIPM",
  description:
    "Mistakes à éviter sur les appels courtiers, alternatives, garde-fous live en démo et checklist avant l’appel — LECIPM.",
};

export default function MarketingMistakesPage() {
  return <MistakesPageClient />;
}
