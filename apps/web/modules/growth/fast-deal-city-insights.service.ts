/**
 * Max 5 conservative insight lines — association only, no causal claims.
 */

import type { FastDealCityRankEntry } from "@/modules/growth/fast-deal-city-comparison.types";

const MAX = 5;

export function generateCityComparisonInsights(ranked: FastDealCityRankEntry[]): string[] {
  const lines: string[] = [];

  lines.push(
    "Ranking uses operator-logged Fast Deal signals only — not proof that any city mechanically outperforms another.",
  );

  if (ranked.length === 0) {
    return lines.slice(0, MAX);
  }

  const sorted = [...ranked].sort((a, b) => b.performanceScore - a.performanceScore);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  if (top && top.meta.sampleSize >= 12 && top.derived.playbookCompletionRate != null) {
    lines.push(
      `${top.city} shows the highest playbook completion ratio in this window among cities with enough playbook logs — still an internal metric.`,
    );
  }

  if (
    top &&
    bottom &&
    top.city !== bottom.city &&
    top.derived.progressionRate != null &&
    bottom.derived.progressionRate != null &&
    top.derived.progressionRate > bottom.derived.progressionRate + 0.08
  ) {
    lines.push(
      `${top.city} logged stronger progression ratios than ${bottom.city} — verify CRM tagging consistency before acting.`,
    );
  }

  const thin = ranked.filter((r) => r.meta.sampleSize < 12);
  if (thin.length > 0) {
    lines.push(
      `${thin.length} market(s) have very small samples — ranks among them are unreliable.`,
    );
  }

  const lowConf = ranked.filter((r) => r.confidence === "low");
  if (lowConf.length === ranked.length && ranked.length > 1) {
    lines.push("All cities are low-confidence in this window — widen the date range or improve attribution labels.");
  }

  return lines.slice(0, MAX);
}
