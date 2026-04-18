import type { PrRecommendation, PrRiskLevel } from "./pr-risk-detector";

export type PrSummaryInput = {
  riskLevel: PrRiskLevel;
  criticalChanges: string[];
  warnings: string[];
  recommendation: PrRecommendation;
  base: string;
  head: string;
};

/**
 * Human-readable summary for CI logs or PR comments (no secrets).
 */
export function generatePrSummaryMarkdown(input: PrSummaryInput): string {
  const lines: string[] = [
    `## LECIPM PR risk summary`,
    ``,
    `- **Range:** \`${input.base}..${input.head}\``,
    `- **Risk level:** **${input.riskLevel}**`,
    `- **Recommendation:** **${input.recommendation}**`,
    ``,
  ];

  if (input.criticalChanges.length) {
    lines.push(`### Critical-area changes`, ``);
    for (const c of input.criticalChanges.slice(0, 40)) {
      lines.push(`- ${c}`);
    }
    if (input.criticalChanges.length > 40) {
      lines.push(`- … (${input.criticalChanges.length - 40} more)`);
    }
    lines.push(``);
  }

  if (input.warnings.length) {
    lines.push(`### Warnings`, ``);
    for (const w of input.warnings.slice(0, 60)) {
      lines.push(`- ${w}`);
    }
    if (input.warnings.length > 60) {
      lines.push(`- … (${input.warnings.length - 60} more)`);
    }
    lines.push(``);
  }

  lines.push(
    `### Meaning`,
    ``,
    `- **SAFE** — no critical paths and no blockers detected by heuristics.`,
    `- **REVIEW_REQUIRED** — critical paths or notable churn; human review before merge.`,
    `- **BLOCK** — possible secret material or dangerous deletion; do not merge until resolved.`,
    ``,
  );

  return lines.join("\n");
}
