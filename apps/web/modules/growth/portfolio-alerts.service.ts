import type { CampaignPortfolioInput, PortfolioOptimizationSummary } from "./portfolio-optimization.types";

export type PortfolioAlert = {
  kind:
    | "concentration_risk"
    | "too_many_unknowns"
    | "profitable_but_underfunded"
    | "unprofitable_budget_drag"
    | "no_reallocation_candidates";
  severity: "warning" | "critical";
  message: string;
};

const CONCENTRATION_PCT = 0.55;

export function computePortfolioAlerts(
  summary: PortfolioOptimizationSummary,
  inputs: CampaignPortfolioInput[],
): PortfolioAlert[] {
  const out: PortfolioAlert[] = [];
  const total = summary.totalBudget;
  if (total <= 0) {
    out.push({
      kind: "no_reallocation_candidates",
      severity: "warning",
      message: "No attributed spend in window — portfolio reallocation suggestions need manual spend input.",
    });
    return out;
  }

  const unknownShare =
    inputs.length > 0 ?
      inputs.filter((c) => c.profitabilityStatus === "INSUFFICIENT_DATA").length / inputs.length
    : 1;
  if (unknownShare >= 0.6) {
    out.push({
      kind: "too_many_unknowns",
      severity: "warning",
      message: "Most campaigns have insufficient profit data — treat portfolio scores as exploratory.",
    });
  }

  for (const c of inputs) {
    if (total > 0 && c.spend / total >= CONCENTRATION_PCT && c.spend > 80) {
      out.push({
        kind: "concentration_risk",
        severity: "warning",
        message: `A large share of budget (~${Math.round((c.spend / total) * 100)}%) is on “${c.campaignKey}” — diversification may reduce single-channel risk.`,
      });
      break;
    }
  }

  const profitableLowSpend = inputs.filter(
    (c) => c.profitabilityStatus === "PROFITABLE" && c.spend < 40 && (c.confidenceScore ?? 0) >= 0.5,
  );
  if (profitableLowSpend.length > 0) {
    out.push({
      kind: "profitable_but_underfunded",
      severity: "warning",
      message: `Some profitable-looking campaigns have low spend (${profitableLowSpend.map((x) => x.campaignKey).slice(0, 3).join(", ")}) — consider testing scale after manual review.`,
    });
  }

  const drag = inputs.filter(
    (c) =>
      c.profitabilityStatus === "UNPROFITABLE" &&
      c.spend >= 60 &&
      (c.confidenceScore ?? 0) >= 0.55,
  );
  if (drag.length > 0) {
    out.push({
      kind: "unprofitable_budget_drag",
      severity: "warning",
      message: `Unprofitable campaigns still carry material spend (${drag.map((d) => d.campaignKey).slice(0, 3).join(", ")}) — review before increasing portfolio spend.`,
    });
  }

  if (summary.recommendations.length === 0 && inputs.length >= 2 && total > 50) {
    out.push({
      kind: "no_reallocation_candidates",
      severity: "warning",
      message: "No conservative reallocation pairs met thresholds (confidence, spend floor, caps) — monitor and gather volume.",
    });
  }

  return out;
}
