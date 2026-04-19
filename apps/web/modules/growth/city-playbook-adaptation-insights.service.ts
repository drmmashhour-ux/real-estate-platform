/**
 * Bundle-level insight lines — max 5, non-causal.
 */

import type { CityPlaybookAdaptation } from "@/modules/growth/city-playbook-adaptation.types";

const MAX = 5;

export function generateAdaptationBundleInsights(params: {
  sourceCity: string | null;
  adaptations: CityPlaybookAdaptation[];
  skippedTargets: { city: string; reason: string }[];
}): string[] {
  const lines: string[] = [];

  lines.push(
    "Suggestions mirror logged metric gaps — they do not prove that copying another city’s tactics will reproduce results.",
  );

  if (!params.sourceCity) {
    return lines.slice(0, MAX);
  }

  lines.push(
    `${params.sourceCity} is used only as an internal reference from this window — not as a causal “winner.”`,
  );

  if (params.adaptations.some((a) => a.confidence === "low")) {
    lines.push("At least one adaptation is low-confidence — widen the window or fix city metadata before relying on ranks.");
  }

  if (params.skippedTargets.length > 0) {
    lines.push(`${params.skippedTargets.length} market(s) were skipped or received only thin-data warnings.`);
  }

  const weak = params.adaptations.filter((a) =>
    a.warnings.some((w) => w.toLowerCase().includes("insufficient")),
  );
  if (weak.length > 0) {
    lines.push("Some targets have insufficient overlapping metrics — compare only where both numerator and denominator exist.");
  }

  return lines.slice(0, MAX);
}
