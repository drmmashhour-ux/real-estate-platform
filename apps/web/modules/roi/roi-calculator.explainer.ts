import type { RoiComparisonResult } from "./roi-calculator.types";

export function formatRoiSummaryMarkdown(r: RoiComparisonResult): string {
  const g = r.gain.absoluteCents / 100;
  const sign = g >= 0 ? "+" : "";
  return [
    `Current net (modeled): $${(r.currentPlatform.netRevenueCents / 100).toFixed(2)} CAD`,
    `LECIPM net (modeled): $${(r.lecipm.netRevenueCents / 100).toFixed(2)} CAD`,
    `Difference: ${sign}$${Math.abs(g).toFixed(2)} CAD${r.gain.percent != null ? ` (${sign}${(r.gain.percent * 100).toFixed(1)}%)` : ""}`,
    "",
    r.disclaimers.join(" "),
  ].join("\n");
}
