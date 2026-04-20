/**
 * User-safe explanation lines for ranking / browse — never changes sort order here.
 */

import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";

export function buildRankingAutonomyExplanationLines(signals: MarketplaceSignal[]): readonly string[] {
  try {
    const lines: string[] = [];
    if (signals.some((s) => s.type === "trust_risk")) {
      lines.push("Trust quality signals detected for some inventory — ranking still uses deterministic public rules.");
    }
    if (signals.some((s) => s.type === "inactive_inventory")) {
      lines.push("Some listings show low booking activity — visibility may still follow featured/newest ordering.");
    }
    return lines.slice(0, 6);
  } catch {
    return [];
  }
}
