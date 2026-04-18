import type { CompanyInsight } from "./company-insights.types";
import type { MetricDelta } from "./trend-comparison.service";

/**
 * Surfaces large window-over-window deltas as insights — factual, no external attribution.
 */
export function summarizeAnomalies(deltas: MetricDelta[], sampleHint?: string): CompanyInsight[] {
  const insights: CompanyInsight[] = [];
  for (const d of deltas) {
    if (d.delta === null) continue;
    const abs = Math.abs(d.delta);
    if (abs < 1) continue;
    const worsened =
      (d.key.includes("blocked") || d.key.includes("open") || d.key.includes("overdue")) && d.delta > 0;
    const improved =
      (d.key.includes("blocked") || d.key.includes("open") || d.key.includes("overdue")) && d.delta < 0;
    const growth = d.key.includes("leads") || d.key.includes("closed");
    let category: CompanyInsight["category"] = "execution";
    if (d.key.includes("compliance")) category = "compliance";
    if (d.key.includes("finance")) category = "finance";
    if (growth) category = "growth";

    insights.push({
      insightType: "window_delta",
      title: `Variation ${d.key}`,
      summary: `Mesure courante ${d.current ?? "n/a"} vs période précédente ${d.previous ?? "n/a"} (Δ ${d.delta}).`,
      impactLevel: abs >= 3 ? "high" : abs >= 2 ? "medium" : "low",
      urgency: worsened ? "high" : improved ? "low" : "medium",
      evidence: [
        {
          ref: `metric.${d.key}`,
          value: d.delta,
          nature: "fact",
        },
      ],
      confidence: sampleHint ? 0.55 : 0.72,
      category,
      suggestedActions: [
        {
          label: "Vérifier les dossiers sous-jacents dans les outils internes avant d’agir.",
          nature: "fact_check",
        },
      ],
    });
  }
  return insights;
}
