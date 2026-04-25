import type { Metadata } from "next";
import { ObjectionsPageClient } from "@/components/demo/ObjectionsPageClient";

export const metadata: Metadata = {
  title: "Objections courtiers & script démo | LECIPM",
  description:
    "Réponses mot à mot aux objections courantes des courtiers au Québec et script de démo LECIPM. Panneau d’accès rapide pour les appels.",
};

export default function MarketingObjectionsPage() {
  return <ObjectionsPageClient />;
}
