import type { StrategySuggestion } from "./run-all-strategies";

export function staleListingRevival(ctx: { signals: { daysOnMarket: number; inquiries: number } }): StrategySuggestion[] {
  if (ctx.signals.daysOnMarket < 30 || ctx.signals.inquiries >= 2) return [];
  return [
    {
      suggestionType: "stale_listing_revival",
      title: "Rafraîchissement factuel de l’annonce",
      summary: "Réviser titre/description avec les données déjà connues; ajouter médias si manquants.",
      payload: {},
      confidence: 0.65,
      brokerApprovalRequired: true,
      whyNow: "Ancienneté élevée avec peu de demandes dans la fenêtre interne.",
      expectedBenefit: "Meilleure clarté pour les acheteurs déjà exposés.",
      risksAndCautions: "Ne pas suggérer baisse de prix automatique — décision broker.",
    },
  ];
}
