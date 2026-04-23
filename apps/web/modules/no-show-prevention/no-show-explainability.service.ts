import type { NoShowExplainability, NoShowRiskResult } from "./no-show.types";

/**
 * Plain-language pack for UI and compliance — never implies certainty of no-show.
 */
export function buildNoShowExplainability(
  r: NoShowRiskResult,
  _visitId: string,
): NoShowExplainability {
  const top = r.reasons.slice(0, 4).map((label, i) => ({
    label,
    weight: i === 0 ? "higher" : "moderate",
  }));
  return {
    summary: `Estimated no-show *support* score is ${r.riskScore} (${r.riskBand}). This is a planning signal, not a diagnosis.`,
    topSignals: top,
    nextBestAction: r.suggestedAction,
    complianceNote:
      "LECIPM uses probabilistic heuristics for scheduling quality. Outcomes can still vary; be respectful in buyer-facing text.",
  };
}

export function oneLineForBroker(r: NoShowRiskResult): string {
  return `Risk band ${r.riskBand} (score ${r.riskScore}). ${r.suggestedAction}`;
}
