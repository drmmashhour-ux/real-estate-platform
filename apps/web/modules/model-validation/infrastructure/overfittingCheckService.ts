import type { PrismaClient } from "@prisma/client";
import type { CalibrationMetrics } from "../domain/validation.types";
import { computeCalibrationMetrics } from "./calibrationMetricsService";
import { getRunWithItems } from "./validationRepository";

export type OverfittingRiskLevel = "low" | "medium" | "high";

export type OverfittingAssessment = {
  overfittingRisk: OverfittingRiskLevel;
  reasons: string[];
};

/**
 * Heuristic: same-set gains with fresh-set degradation or rising dangerous FPs suggest overspecialization.
 * Deterministic thresholds — human review required before further tuning.
 */
export function assessOverfittingRisk(input: {
  baseline: CalibrationMetrics;
  tunedSame: CalibrationMetrics;
  tunedFresh: CalibrationMetrics;
}): OverfittingAssessment {
  const reasons: string[] = [];
  let score = 0;

  const sameTrust =
    (input.tunedSame.trustAgreementRate ?? 0) - (input.baseline.trustAgreementRate ?? 0);
  const freshTrust =
    (input.tunedFresh.trustAgreementRate ?? 0) - (input.baseline.trustAgreementRate ?? 0);
  if (sameTrust > 0.04 && freshTrust < -0.02) {
    reasons.push("Trust agreement rose on the same 50 listings but fell on the fresh 50 vs baseline.");
    score += 2;
  }

  const sameDeal =
    (input.tunedSame.dealAgreementRate ?? 0) - (input.baseline.dealAgreementRate ?? 0);
  const freshDeal =
    (input.tunedFresh.dealAgreementRate ?? 0) - (input.baseline.dealAgreementRate ?? 0);
  if (sameDeal > 0.04 && freshDeal < -0.02) {
    reasons.push("Deal agreement rose on the same set but fell on the fresh set vs baseline.");
    score += 2;
  }

  const fpHtFresh =
    (input.tunedFresh.falsePositiveHighTrustRate ?? 0) - (input.baseline.falsePositiveHighTrustRate ?? 0);
  if (fpHtFresh > 0.05) {
    reasons.push("False positives for high trust increased materially on the fresh set vs baseline.");
    score += 2;
  }

  const fpSoFresh =
    (input.tunedFresh.falsePositiveStrongOpportunityRate ?? 0) -
    (input.baseline.falsePositiveStrongOpportunityRate ?? 0);
  if (fpSoFresh > 0.03) {
    reasons.push("False positives for strong_opportunity increased on the fresh set vs baseline.");
    score += 2;
  }

  const calSame =
    (input.tunedSame.lowConfidenceDisagreementConcentration ?? 0) -
    (input.baseline.lowConfidenceDisagreementConcentration ?? 0);
  const calFresh =
    (input.tunedFresh.lowConfidenceDisagreementConcentration ?? 0) -
    (input.baseline.lowConfidenceDisagreementConcentration ?? 0);
  if (calSame > 0.06 && calFresh < -0.05) {
    reasons.push("Low-confidence disagreement concentration improved on same set but worsened on fresh data.");
    score += 1;
  }

  if (reasons.length === 0) {
    return { overfittingRisk: "low", reasons: ["No strong same-vs-fresh divergence or FP regression signals."] };
  }

  const overfittingRisk: OverfittingRiskLevel = score >= 4 ? "high" : score >= 2 ? "medium" : "low";
  return { overfittingRisk, reasons };
}

export type ValidationTripletIds = {
  baselineRunId: string;
  tunedSameRunId: string | null;
  tunedFreshRunId: string | null;
};

/** Resolve baseline / same-set / fresh runs from a tuned validation run (same tuning profile + baseline). */
export async function resolveValidationTripletForOverfitting(
  db: PrismaClient,
  runId: string,
): Promise<ValidationTripletIds | { error: string }> {
  const run = await db.modelValidationRun.findUnique({ where: { id: runId } });
  if (!run) return { error: "Run not found" };
  if (!run.appliedTuningProfileId || !run.comparisonTargetRunId) {
    return { error: "Run must have appliedTuningProfileId and comparisonTargetRunId" };
  }
  const baselineId = run.comparisonTargetRunId;
  const pid = run.appliedTuningProfileId;

  if (run.validationRunKind === "tuned_fresh_set") {
    const same = await db.modelValidationRun.findFirst({
      where: {
        validationRunKind: "tuned_same_set",
        appliedTuningProfileId: pid,
        comparisonTargetRunId: baselineId,
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      baselineRunId: baselineId,
      tunedSameRunId: same?.id ?? null,
      tunedFreshRunId: run.id,
    };
  }

  if (run.validationRunKind === "tuned_same_set") {
    const fresh = await db.modelValidationRun.findFirst({
      where: {
        validationRunKind: "tuned_fresh_set",
        appliedTuningProfileId: pid,
        comparisonTargetRunId: baselineId,
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      baselineRunId: baselineId,
      tunedSameRunId: run.id,
      tunedFreshRunId: fresh?.id ?? null,
    };
  }

  return { error: "Use a tuned_same_set or tuned_fresh_set run, or pass explicit run ids in the query string." };
}

export async function buildOverfittingAssessmentFromRuns(
  db: PrismaClient,
  triplet: { baselineRunId: string; tunedSameRunId: string; tunedFreshRunId: string },
) {
  const [b, s, f] = await Promise.all([
    getRunWithItems(db, triplet.baselineRunId),
    getRunWithItems(db, triplet.tunedSameRunId),
    getRunWithItems(db, triplet.tunedFreshRunId),
  ]);
  if (!b || !s || !f) {
    return { error: "One or more runs not found" as const };
  }
  return assessOverfittingRisk({
    baseline: computeCalibrationMetrics(b.items),
    tunedSame: computeCalibrationMetrics(s.items),
    tunedFresh: computeCalibrationMetrics(f.items),
  });
}
