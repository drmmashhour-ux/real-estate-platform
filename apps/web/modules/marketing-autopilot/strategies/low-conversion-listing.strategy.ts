import type { StrategySuggestion } from "./run-all-strategies";

export function lowConversionListing(ctx: {
  signals: { views: number; inquiries: number };
}): StrategySuggestion[] {
  if (ctx.signals.views < 30 || ctx.signals.inquiries >= 2) return [];
  return [
    {
      suggestionType: "low_conversion",
      title: "Clarifier l’appel à l’action et les contacts",
      summary: "Brouillon de message pour répondre aux visites sans fausse rareté.",
      payload: {},
      confidence: 0.55,
      brokerApprovalRequired: true,
      whyNow: "Les vues internes ne se traduisent pas par des demandes.",
      expectedBenefit: "Réduction des frictions de contact.",
      risksAndCautions: "Ne pas promettre disponibilité ou offres non confirmées.",
    },
  ];
}
