/**
 * Copy and labeling helpers — distinguishes facts vs inference vs estimates for founder surfaces.
 */

export const founderIntelligenceDisclaimer =
  "Données résidentielles LECIPM agrégées. Aucune cause externe n’est inventée; les hypothèses sont étiquetées.";

export function labelInference(text: string): string {
  return `[Inférence] ${text}`;
}

export function labelHypothesis(text: string): string {
  return `[Hypothèse] ${text}`;
}

export function labelEstimate(text: string): string {
  return `[Estimation] ${text}`;
}

export function labelRecommendation(text: string): string {
  return `[Recommandation] ${text}`;
}
