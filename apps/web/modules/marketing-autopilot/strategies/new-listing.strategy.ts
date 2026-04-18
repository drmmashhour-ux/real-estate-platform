import type { StrategySuggestion } from "./run-all-strategies";

export function newListingStrategy(ctx: {
  signals: { daysOnMarket: number };
}): StrategySuggestion[] {
  if (ctx.signals.daysOnMarket > 7) return [];
  return [
    {
      suggestionType: "new_listing_package",
      title: "Assembler le paquet « nouvelle inscription »",
      summary: "Préparer brouillons email + réseaux + méta SEO pour révision.",
      payload: {},
      confidence: 0.75,
      brokerApprovalRequired: true,
      whyNow: "La fiche est récente — aligner les canaux sur les faits publiés.",
      expectedBenefit: "Cohérence du message sans promesse de performance marché.",
      risksAndCautions: "Ne pas publier sans relecture; pas d’urgence artificielle.",
    },
  ];
}
