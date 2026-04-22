import type { SeniorOperatorPerformance, SeniorResidence } from "@prisma/client";

import { prisma } from "@/lib/db";

import { assignSoinsBadge } from "./soins-quality-badge.service";
import {
  computeSoinsQualityScores,
  createBaselineSignals,
  mergeSoinsSignals,
  type SoinsQualitySignals,
} from "./soins-quality-score.service";
import type {
  ResidenceQualityBreakdownDto,
  ResidentServiceExperienceDto,
  SoinsQualityResult,
} from "./soins-quality.types";

export function buildSoinsQualityResult(signals: SoinsQualitySignals): SoinsQualityResult {
  const computed = computeSoinsQualityScores(signals);
  const badge = assignSoinsBadge(computed, signals);
  return { ...computed, badge, signals };
}

/** Map persisted operator/residence proxies into scoring signals (best-effort; never clinical). */
export function signalsFromSeniorRecord(
  residence: Pick<SeniorResidence, "rating" | "mealsIncluded"> & {
    seniorOperatorPerformance?: SeniorOperatorPerformance | null;
  },
  windowDays = 90,
): SoinsQualitySignals {
  const perf = residence.seniorOperatorPerformance;
  const base = createBaselineSignals(windowDays);

  const overlay: Partial<SoinsQualitySignals> = {
    windowDays,
    /** `SeniorOperatorPerformance.responseTimeAvg` is treated as minutes when ≤ 360; larger values treated as hours→minutes. */
    avgAlertResponseMinutes:
      perf?.responseTimeAvg == null ? null : normalizeOperatorResponseMinutes(perf.responseTimeAvg),
    operatorProfileCompleteness:
      perf?.profileCompleteness != null ?
        perf.profileCompleteness > 1
          ? Math.min(1, perf.profileCompleteness / 100)
          : Math.min(1, perf.profileCompleteness)
      : null,
    structuredFeedbackScoreAvg:
      residence.rating != null && residence.rating > 0 ?
        clamp100(residence.rating * 20)
      : null,
    transparencyDocumentationTimeliness:
      perf?.trustScore != null ?
        clamp01(perf.trustScore > 1 ? perf.trustScore / 100 : perf.trustScore)
      : null,
    mealCompletionRate: residence.mealsIncluded ? 0.94 : 0.88,
    documentedCareCompletenessRatio:
      perf?.profileCompleteness != null ?
        clamp01((perf.profileCompleteness > 1 ? perf.profileCompleteness / 100 : perf.profileCompleteness) * 0.92 + 0.08)
      : null,
    criticalUnresolvedOperationalIssues: false,
  };

  return mergeSoinsSignals(base, overlay);
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function clamp100(x: number): number {
  return Math.min(100, Math.max(0, x));
}

export function dataFreshnessFromSignals(s: SoinsQualitySignals): ResidenceQualityBreakdownDto["dataFreshness"] {
  const hasTelemetry =
    s.avgAlertResponseMinutes != null ||
    s.familyMessageResponseRate != null ||
    s.mealCompletionRate != null;
  if (hasTelemetry) return "live";
  if (s.operatorProfileCompleteness != null || s.structuredFeedbackScoreAvg != null) return "partial";
  return "baseline";
}

export async function getResidenceQualityBreakdown(residenceId: string): Promise<ResidenceQualityBreakdownDto | null> {
  const residence = await prisma.seniorResidence.findUnique({
    where: { id: residenceId },
    include: { seniorOperatorPerformance: true },
  });
  if (!residence) return null;

  const signals = signalsFromSeniorRecord(residence, 90);
  const result = buildSoinsQualityResult(signals);

  return {
    ...result,
    residenceId: residence.id,
    residenceName: residence.name,
    dataFreshness: dataFreshnessFromSignals(signals),
  };
}

/**
 * Resident/family perspective for an AI match profile id (`SeniorAiProfile.id`).
 * Blends residence-level signals from the latest match with profile confidence (non-clinical).
 */
export async function getResidentServiceExperienceScore(
  residentProfileId: string,
): Promise<ResidentServiceExperienceDto | null> {
  const profile = await prisma.seniorAiProfile.findUnique({
    where: { id: residentProfileId },
    include: {
      matchingResults: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { residence: { include: { seniorOperatorPerformance: true } } },
      },
    },
  });
  if (!profile) return null;

  const match = profile.matchingResults[0];
  const primaryResidenceId = match?.residenceId ?? null;

  let signals: SoinsQualitySignals;
  if (match?.residence) {
    const baseSignals = signalsFromSeniorRecord(match.residence, 90);
    const confidenceBoost =
      profile.profileConfidence != null ? clamp01(profile.profileConfidence) * 3 : 0;
    const experienceBump = clamp01((match.finalScore - 50) / 50) * 4;
    signals = mergeSoinsSignals(baseSignals, {
      structuredFeedbackScoreAvg: clamp100(
        (baseSignals.structuredFeedbackScoreAvg ?? 72) + confidenceBoost + experienceBump,
      ),
    });
  } else {
    signals = createBaselineSignals(90);
  }

  const result = buildSoinsQualityResult(signals);

  return {
    ...result,
    residentProfileId: profile.id,
    primaryResidenceId,
    perspective: "resident_experience_view",
  };
}
