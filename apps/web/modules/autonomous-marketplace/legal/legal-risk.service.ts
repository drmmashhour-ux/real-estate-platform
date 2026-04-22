/**
 * Deterministic legal / compliance scoring (v1) — explainable, no side effects.
 */

export type LegalRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface LegalRiskResult {
  score: number; // 0–100
  level: LegalRiskLevel;
  reasons: string[];
  requiresBlock: boolean;
  requiresApproval: boolean;
}

export interface LegalRiskContext {
  actionType: string;
  entityType?: string;
  regionCode?: string;
  signals?: string[];
  metadata?: Record<string, unknown>;
}

export function evaluateLegalRisk(ctx: LegalRiskContext): LegalRiskResult {
  const reasons: string[] = [];
  let score = 0;

  // 🚨 FRAUD SIGNAL
  if (ctx.signals?.includes("fraud_flag")) {
    score += 60;
    reasons.push("Fraud signal detected");
  }

  // 💰 PAYMENT / PAYOUT RISK
  if (ctx.signals?.includes("payout_anomaly")) {
    score += 40;
    reasons.push("Payout anomaly detected");
  }

  // 📉 LOW ACTIVITY / SUSPICIOUS LISTING
  if (ctx.signals?.includes("low_booking_activity")) {
    score += 15;
    reasons.push("Low booking activity");
  }

  // 🌍 REGION RISK (Syria example)
  if (ctx.regionCode === "SY") {
    score += 30;
    reasons.push("High-risk region (restricted execution)");
  }

  // ⚖️ ACTION TYPE RISK
  if (ctx.actionType === "PAYMENT" || ctx.actionType === "PAYOUT") {
    score += 25;
    reasons.push("Financial operation");
  }

  // 🔒 CLAMP SCORE
  score = Math.min(score, 100);

  // 🧠 DETERMINE LEVEL
  let level: LegalRiskLevel = "LOW";
  if (score >= 75) level = "CRITICAL";
  else if (score >= 50) level = "HIGH";
  else if (score >= 25) level = "MEDIUM";

  return {
    score,
    level,
    reasons,
    requiresBlock: level === "CRITICAL",
    requiresApproval: level === "HIGH" || level === "CRITICAL",
  };
}
