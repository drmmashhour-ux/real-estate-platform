import type { BudgetGuardrailResult } from "./operator-v2.types";

export function evaluateBudgetGuardrails(input: {
  currentBudget: number;
  proposedBudget: number;
  confidenceScore: number;
  approvalStatus: string;
  hasConflicts: boolean;
  cpl?: number | null;
  ltv?: number | null;
  profitabilityStatus?: "PROFITABLE" | "BREAKEVEN" | "UNPROFITABLE" | "INSUFFICIENT_DATA" | string | null;
  evidenceScore?: number | null;
  environment: "development" | "staging" | "production";
  /** When true, approval is not required (simulation / dry-run only). Execute path must omit this. */
  simulateOnly?: boolean;
}): BudgetGuardrailResult {
  const blockingReasons: string[] = [];
  const warnings: string[] = [];

  const delta =
    input.currentBudget > 0 ? (input.proposedBudget - input.currentBudget) / input.currentBudget : 0;

  let cappedBudget: number | null = null;

  if (!input.simulateOnly && input.approvalStatus !== "APPROVED") {
    blockingReasons.push("Recommendation is not approved.");
  }

  if (input.hasConflicts) {
    blockingReasons.push("Conflicting recommendations detected.");
  }

  if (input.confidenceScore < 0.65) {
    blockingReasons.push("Confidence too low for external budget sync.");
  }

  if ((input.evidenceScore ?? 0) < 0.55) {
    blockingReasons.push("Evidence score too low for spend-impacting action.");
  }

  if (input.profitabilityStatus !== "PROFITABLE") {
    warnings.push("Campaign is not clearly profitable.");
  }

  if (input.ltv != null && input.cpl != null && input.ltv < input.cpl) {
    blockingReasons.push("Campaign LTV is below CPL.");
  }

  if (delta > 0.3) {
    cappedBudget = Number((input.currentBudget * 1.3).toFixed(2));
    warnings.push("Requested increase exceeds max +30% cap; capped budget applied.");
  }

  if (delta < -0.3) {
    cappedBudget = Number((input.currentBudget * 0.7).toFixed(2));
    warnings.push("Requested decrease exceeds max -30% cap; capped budget applied.");
  }

  if (input.environment === "production" && input.currentBudget <= 0) {
    blockingReasons.push("Current budget is invalid or missing.");
  }

  return {
    allowed: blockingReasons.length === 0,
    blockingReasons,
    warnings,
    cappedBudget,
  };
}
