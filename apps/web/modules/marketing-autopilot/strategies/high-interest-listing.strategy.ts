import type { StrategySuggestion } from "./run-all-strategies";

export function highInterestListing(ctx: { signals: { inquiries: number } }): StrategySuggestion[] {
  if (ctx.signals.inquiries < 4) return [];
  return [
    {
      suggestionType: "high_interest_followup",
      title: "Suivi court pour demandes entrantes",
      summary: "Modèle de réponse factuelle aux acheteurs ayant manifesté de l’intérêt.",
      payload: {},
      confidence: 0.6,
      brokerApprovalRequired: true,
      whyNow: "Volume de demandes interne élevé dans la période analysée.",
      expectedBenefit: "Réponses cohérentes et traçables.",
      risksAndCautions: "Ne pas partager d’informations confidentielles non prévues au mandat.",
    },
  ];
}
