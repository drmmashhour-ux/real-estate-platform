/**
 * Max 5 non-causal insight lines for market expansion.
 */

import type { MarketExpansionCandidate } from "@/modules/growth/market-expansion.types";

const MAX = 5;

export function generateMarketExpansionInsights(params: {
  referenceCity: string | null;
  topCandidates: MarketExpansionCandidate[];
}): string[] {
  const lines: string[] = [];
  lines.push(
    "Rankings weight logged Fast Deal + listing supply signals only — not proof a new market will perform like the reference city.",
  );
  if (!params.referenceCity) {
    return lines.slice(0, MAX);
  }
  const t = params.topCandidates[0];
  if (t) {
    lines.push(
      `Top expansion row: ${t.city} (readiness ${t.readiness}, confidence ${t.confidence}) — still requires local operator validation.`,
    );
  }
  const low = params.topCandidates.filter((c) => c.confidence === "low");
  if (low.length > 0) {
    lines.push(`${low.length} candidate(s) are low-confidence — widen the window or improve city metadata.`);
  }
  if (params.topCandidates.length > 0) {
    const wk = params.topCandidates.find((c) => c.warnings.length > 0);
    if (wk) {
      lines.push("At least one row has data-completeness warnings — read rationale before any go-to-market plan.");
    }
  }
  return lines.slice(0, MAX);
}
