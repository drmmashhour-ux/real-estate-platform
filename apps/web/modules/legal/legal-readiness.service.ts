import type { LegalHubSummary } from "./legal.types";
import type { LegalReadinessLevel, LegalReadinessScore } from "./legal-readiness.types";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Stricter than navigation UI — “in_progress” still counts as incomplete for readiness scoring. */
function isRequirementCompleteForReadiness(state: string): boolean {
  return state === "approved" || state === "waived" || state === "submitted";
}

function isRejectedState(state: string): boolean {
  return state === "rejected";
}

/**
 * Deterministic readiness score from Legal Hub summary only (no ML, no DB).
 * Never reports `ready` when critical risks or rejected checklist items remain.
 */
export function computeLegalReadinessScore(summary: LegalHubSummary): LegalReadinessScore {
  try {
    let total = 0;
    let completed = 0;
    let rejected = 0;
    let missingCritical = 0;
    let missingOptional = 0;

    for (const w of summary.workflows) {
      const brokerHeavy = Boolean(w.brokerOrAdminReviewRequired);
      for (const b of w.requirements) {
        total += 1;
        const st = b.state;
        if (isRequirementCompleteForReadiness(st)) {
          completed += 1;
        }
        if (isRejectedState(st)) {
          rejected += 1;
        }
        if (!isRequirementCompleteForReadiness(st)) {
          if (brokerHeavy) missingCritical += 1;
          else missingOptional += 1;
        }
      }
    }

    const criticalRiskCount = summary.portfolio.criticalRiskCount;
    const warningRiskCount = summary.portfolio.warningRiskCount;

    const completionRatio = total > 0 ? completed / total : summary.workflows.length === 0 ? 1 : 0;

    let score = Math.round(72 * completionRatio);
    score -= criticalRiskCount * 22;
    score -= warningRiskCount * 7;
    score -= rejected * 16;
    score -= clamp(missingCritical * 4, 0, 28);
    score -= clamp(missingOptional * 2, 0, 14);

    score = clamp(Math.round(score), 0, 100);

    if (criticalRiskCount > 0) {
      score = Math.min(score, 85);
    }
    if (criticalRiskCount > 0 || rejected > 0) {
      score = Math.min(score, 89);
    }

    const level = scoreToLevel(score, criticalRiskCount, rejected);

    return {
      score,
      level,
      missingCritical,
      missingOptional,
      completed,
      total,
    };
  } catch {
    return {
      score: 0,
      level: "not_ready",
      missingCritical: 0,
      missingOptional: 0,
      completed: 0,
      total: 0,
    };
  }
}

function scoreToLevel(
  score: number,
  criticalRiskCount: number,
  rejectedCount: number,
): LegalReadinessLevel {
  if (criticalRiskCount > 0 || rejectedCount > 0) {
    if (score >= 90) return "mostly_ready";
  }

  if (score <= 39) return "not_ready";
  if (score <= 69) return "partial";
  if (score <= 89) return "mostly_ready";
  return "ready";
}
