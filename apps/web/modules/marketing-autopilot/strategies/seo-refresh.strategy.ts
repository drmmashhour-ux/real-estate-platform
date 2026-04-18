import type { StrategySuggestion } from "./run-all-strategies";

export function seoRefreshStrategy(_ctx: unknown): StrategySuggestion[] {
  return [
    {
      suggestionType: "seo_refresh",
      title: "Rafraîchissement SEO (titre + méta)",
      summary: "Proposition de titre et méta basés sur ville et type (faits présents).",
      payload: {},
      confidence: 0.55,
      brokerApprovalRequired: true,
      whyNow: "Maintenance standard de la fiche résidentielle.",
      expectedBenefit: "Clarté dans les résultats internes.",
      risksAndCautions: "Les moteurs externes ne sont pas garantis; pas de promesse de positionnement.",
    },
  ];
}
