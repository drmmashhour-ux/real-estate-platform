/**
 * Deterministic legal / compliance stress index for unified governance — no side effects.
 */
import type { UnifiedGovernanceInput, UnifiedGovernanceResult } from "./unified-governance.types";

function riskLevelFromScore(score: number): UnifiedGovernanceResult["legalRisk"]["level"] {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}

/**
 * Heuristic legal risk — used by `evaluateUnifiedGovernance` only; does not replace counsel.
 */
export function evaluateLegalRiskForGovernance(input: UnifiedGovernanceInput): UnifiedGovernanceResult["legalRisk"] {
  const reasons: string[] = [];
  let score = 0;
  try {
    if (input.fraudFlag === true) {
      score += 40;
      reasons.push("Fraud flag elevates legal/compliance posture.");
    }
    for (const s of input.signals ?? []) {
      if (s.severity === "critical") {
        score += 35;
        reasons.push(`Critical-class signal: ${s.type}`);
      } else if (s.severity === "warning") {
        score += 18;
        reasons.push(`Warning-class signal: ${s.type}`);
      }
    }
    const hint = input.metadata?.legalRiskScore;
    if (typeof hint === "number" && Number.isFinite(hint)) {
      score = Math.round(Math.min(100, Math.max(0, (score + hint) / 2)));
      reasons.push("External legal risk hint merged.");
    }
    score = Math.min(100, Math.max(0, score));
    const level = riskLevelFromScore(score);
    return {
      score,
      level,
      reasons,
      requiresBlock: score >= 85,
      requiresApproval: score >= 70,
    };
  } catch {
    return {
      score: 40,
      level: "MEDIUM",
      reasons: ["legal_risk_evaluation_fallback"],
      requiresBlock: false,
      requiresApproval: true,
    };
  }
}
