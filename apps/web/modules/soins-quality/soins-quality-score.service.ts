import type {
  SoinsQualityCategoryKey,
  SoinsQualityCategoryScore,
  SoinsQualityComputed,
  SoinsQualityExplainabilityLine,
  SoinsQualitySignals,
} from "./soins-quality.types";

/** Weights sum to 1 — tuned for explainable operations, not clinical claims. */
export const SOINS_CATEGORY_WEIGHTS: Record<SoinsQualityCategoryKey, number> = {
  care_responsiveness: 0.18,
  family_communication: 0.14,
  meal_reliability: 0.14,
  alert_handling: 0.16,
  service_completeness: 0.12,
  resident_experience: 0.14,
  transparency_documentation: 0.12,
};

const CATEGORY_LABELS: Record<SoinsQualityCategoryKey, string> = {
  care_responsiveness: "Care responsiveness",
  family_communication: "Family communication",
  meal_reliability: "Meal reliability",
  alert_handling: "Alert handling",
  service_completeness: "Service completeness",
  resident_experience: "Resident experience",
  transparency_documentation: "Transparency & documentation",
};

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.round(Math.min(hi, Math.max(lo, n)) * 10) / 10;
}

/** Deterministic curve: faster acknowledgment → higher score. */
export function scoreFromAlertResponseMinutes(minutes: number): number {
  if (minutes <= 10) return 100;
  if (minutes <= 30) return clamp(92 + ((30 - minutes) / 20) * 7);
  if (minutes <= 60) return clamp(78 + ((60 - minutes) / 30) * 14);
  if (minutes <= 120) return clamp(58 + ((120 - minutes) / 60) * 20);
  return clamp(58 - Math.min(58, (minutes - 120) / 15));
}

export function scoreFromFamilyResponseRate(rate: number): number {
  return clamp(rate * 100);
}

export function scoreMealReliability(mealCompletionRate: number, missedPer100Days: number): number {
  const base = clamp(mealCompletionRate * 100);
  const penalty = Math.min(45, missedPer100Days * 12);
  return clamp(base - penalty);
}

export function scoreAlertHandling(
  resolutionWithinPolicyRate: number | null,
  avgNonCriticalResolutionMinutes: number | null,
): number {
  const policyScore =
    resolutionWithinPolicyRate != null ? clamp(resolutionWithinPolicyRate * 100) : 62;
  let timeScore = 70;
  if (avgNonCriticalResolutionMinutes != null) {
    const m = avgNonCriticalResolutionMinutes;
    if (m <= 120) timeScore = 92;
    else if (m <= 360) timeScore = clamp(72 + ((360 - m) / 240) * 20);
    else if (m <= 1440) timeScore = clamp(52 + ((1440 - m) / 1080) * 20);
    else timeScore = clamp(52 - Math.min(52, (m - 1440) / 720));
  }
  return clamp(0.55 * policyScore + 0.45 * timeScore);
}

export function scoreServiceCompleteness(ratio: number | null): number {
  if (ratio == null) return 63;
  return clamp(ratio * 100);
}

export function scoreResidentExperience(feedbackAvg: number | null, complaintsPer1000: number | null): number {
  const base = feedbackAvg != null ? clamp(feedbackAvg) : 66;
  if (complaintsPer1000 == null || complaintsPer1000 <= 0) return base;
  const damp = Math.min(35, complaintsPer1000 * 3.5);
  return clamp(base - damp);
}

export function scoreTransparency(timeliness: number | null, profileCompleteness: number | null): number {
  const t = timeliness ?? 0.62;
  const p = profileCompleteness ?? 0.62;
  return clamp(100 * (0.55 * t + 0.45 * p));
}


function explainLines(s: SoinsQualitySignals, cats: SoinsQualityCategoryScore[]): SoinsQualityExplainabilityLine[] {
  const lines: SoinsQualityExplainabilityLine[] = [];
  if (s.avgAlertResponseMinutes != null && s.avgAlertResponseMinutes <= 30) {
    lines.push({
      code: "RESP_FAST",
      impact: "positive",
      message: "Acknowledgment times for operational alerts are strong in the observation window.",
    });
  }
  if (s.avgAlertResponseMinutes != null && s.avgAlertResponseMinutes > 90) {
    lines.push({
      code: "RESP_SLOW",
      impact: "negative",
      message: "Alert acknowledgment is slower than typical benchmarks used on the platform.",
    });
  }
  if ((s.missedMealsPer100ResidentDays ?? 0) > 4) {
    lines.push({
      code: "MEALS_MISSED",
      impact: "negative",
      message: "Missed meal incidents per resident-day are elevated versus platform norms.",
    });
  }
  if ((s.complaintsPer1000ResidentDays ?? 0) > 8) {
    lines.push({
      code: "COMPLAINTS_HIGH",
      impact: "negative",
      message: "Formal complaints logged through permitted channels are higher than typical.",
    });
  }
  if (s.criticalUnresolvedOperationalIssues) {
    lines.push({
      code: "CRITICAL_OPEN",
      impact: "negative",
      message: "Unresolved critical operational items were flagged in-platform (badge capped).",
    });
  }
  const low = cats.filter((c) => c.score < 55);
  for (const c of low.slice(0, 3)) {
    lines.push({
      code: `CAT_LOW_${c.key}`,
      impact: "negative",
      message: `${c.label} is below platform targets — see category rationale.`,
    });
  }
  return lines.slice(0, 12);
}

function strengthsWeaknesses(cats: SoinsQualityCategoryScore[]): { strengths: string[]; weaknesses: string[] } {
  const strengths = cats
    .filter((c) => c.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((c) => `${c.label}: ${c.score.toFixed(0)}/100`);
  const weaknesses = cats
    .filter((c) => c.score < 62)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((c) => `${c.label}: ${c.score.toFixed(0)}/100`);
  return { strengths, weaknesses };
}

/**
 * Deterministic weighted score from normalized signals — same inputs always yield same outputs.
 */
export function computeSoinsQualityScores(signals: SoinsQualitySignals): SoinsQualityComputed {
  const care =
    signals.avgAlertResponseMinutes == null
      ? 64
      : scoreFromAlertResponseMinutes(signals.avgAlertResponseMinutes);

  const family =
    signals.familyMessageResponseRate == null
      ? 62
      : scoreFromFamilyResponseRate(signals.familyMessageResponseRate);

  const meals = scoreMealReliability(
    signals.mealCompletionRate ?? 0.91,
    signals.missedMealsPer100ResidentDays ?? 2,
  );

  const alerts = scoreAlertHandling(
    signals.alertResolutionWithinPolicyRate,
    signals.avgNonCriticalAlertResolutionMinutes,
  );

  const completeness = scoreServiceCompleteness(signals.documentedCareCompletenessRatio);

  const experience = scoreResidentExperience(
    signals.structuredFeedbackScoreAvg,
    signals.complaintsPer1000ResidentDays,
  );

  const transparency = scoreTransparency(
    signals.transparencyDocumentationTimeliness,
    signals.operatorProfileCompleteness,
  );

  const breakdown: SoinsQualityCategoryScore[] = [
    {
      key: "care_responsiveness",
      label: CATEGORY_LABELS.care_responsiveness,
      score: clamp(care),
      weight: SOINS_CATEGORY_WEIGHTS.care_responsiveness,
      rationale:
        signals.avgAlertResponseMinutes != null ?
          `Based on median acknowledgment time (${signals.avgAlertResponseMinutes.toFixed(0)} minutes).`
        : "Insufficient acknowledgment telemetry; neutral baseline applied.",
    },
    {
      key: "family_communication",
      label: CATEGORY_LABELS.family_communication,
      score: clamp(family),
      weight: SOINS_CATEGORY_WEIGHTS.family_communication,
      rationale:
        signals.familyMessageResponseRate != null ?
          `Reply rate inside SLA window: ${(signals.familyMessageResponseRate * 100).toFixed(0)}%.`
        : "Reply-rate telemetry partial; blended baseline.",
    },
    {
      key: "meal_reliability",
      label: CATEGORY_LABELS.meal_reliability,
      score: clamp(meals),
      weight: SOINS_CATEGORY_WEIGHTS.meal_reliability,
      rationale: `Scheduled meal completion vs misses per resident observation (${signals.windowDays} d window).`,
    },
    {
      key: "alert_handling",
      label: CATEGORY_LABELS.alert_handling,
      score: clamp(alerts),
      weight: SOINS_CATEGORY_WEIGHTS.alert_handling,
      rationale: "Combines timely closure rate and median resolution duration for operational alerts.",
    },
    {
      key: "service_completeness",
      label: CATEGORY_LABELS.service_completeness,
      score: clamp(completeness),
      weight: SOINS_CATEGORY_WEIGHTS.service_completeness,
      rationale:
        signals.documentedCareCompletenessRatio != null ?
          "Documentation completion for logged service tasks."
        : "Documentation ratio inferred from partial records.",
    },
    {
      key: "resident_experience",
      label: CATEGORY_LABELS.resident_experience,
      score: clamp(experience),
      weight: SOINS_CATEGORY_WEIGHTS.resident_experience,
      rationale:
        "Combines structured feedback averages with complaint density (platform channels only).",
    },
    {
      key: "transparency_documentation",
      label: CATEGORY_LABELS.transparency_documentation,
      score: clamp(transparency),
      weight: SOINS_CATEGORY_WEIGHTS.transparency_documentation,
      rationale:
        "Timeliness of transparency updates and operator profile completeness as shown on LECIPM.",
    },
  ];

  let overall = 0;
  for (const c of breakdown) {
    overall += c.score * c.weight;
  }
  overall = clamp(overall);

  const { strengths, weaknesses } = strengthsWeaknesses(breakdown);
  const explainability = explainLines(signals, breakdown);

  return {
    overallScore: overall,
    categoryBreakdown: breakdown,
    strengths,
    weaknesses,
    explainability,
  };
}

/** Merge base signals with partial overrides (deterministic last-wins for defined keys). */
export function mergeSoinsSignals(
  base: SoinsQualitySignals,
  overlay: Partial<SoinsQualitySignals>,
): SoinsQualitySignals {
  return { ...base, ...overlay };
}

/** Neutral baseline when integrations are still ramping — produces mid-tier scores. */
export function createBaselineSignals(windowDays = 90): SoinsQualitySignals {
  return {
    windowDays,
    avgAlertResponseMinutes: 48,
    familyMessageResponseRate: 0.72,
    mealCompletionRate: 0.93,
    missedMealsPer100ResidentDays: 2.2,
    alertResolutionWithinPolicyRate: 0.86,
    avgNonCriticalAlertResolutionMinutes: 320,
    documentedCareCompletenessRatio: 0.76,
    complaintsPer1000ResidentDays: 3.5,
    structuredFeedbackScoreAvg: 74,
    transparencyDocumentationTimeliness: 0.7,
    operatorProfileCompleteness: 0.68,
    criticalUnresolvedOperationalIssues: false,
  };
}
