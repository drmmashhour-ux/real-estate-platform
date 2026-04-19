/**
 * Deterministic 0–100 scoring + execution band — sparse data lowers confidence, not arbitrary harsh penalties.
 */

import type {
  BrokerExecutionBand,
  BrokerPerformanceConfidence,
  BrokerPerformanceMetrics,
} from "./broker-performance.types";

export type BrokerPerformanceMetricsInput = Omit<
  BrokerPerformanceMetrics,
  | "activityScore"
  | "conversionScore"
  | "disciplineScore"
  | "overallScore"
  | "confidenceLevel"
  | "executionBand"
>;

const MS_HOUR = 60 * 60 * 1000;

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Pull score toward neutral (50) when samples are thin — avoids crushing low-volume brokers. */
export function blendTowardNeutral(score: number, weight: number): number {
  const w = clamp(weight, 0, 1);
  return Math.round(score * w + 50 * (1 - w));
}

export function deriveConfidence(leadsAssigned: number): BrokerPerformanceConfidence {
  if (leadsAssigned <= 4) return "insufficient";
  if (leadsAssigned < 12) return "low";
  if (leadsAssigned < 25) return "medium";
  return "high";
}

export function confidenceBlendWeight(conf: BrokerPerformanceConfidence): number {
  switch (conf) {
    case "insufficient":
      return 0.35;
    case "low":
      return 0.55;
    case "medium":
      return 0.78;
    default:
      return 1;
  }
}

function hourScore(hours: number): number {
  if (hours <= 4) return 95;
  if (hours <= 12) return 82;
  if (hours <= 24) return 68;
  if (hours <= 72) return 52;
  return 38;
}

export function deriveActivityScore(input: BrokerPerformanceMetricsInput): number {
  const n = input.leadsAssigned;
  const contactRate = n > 0 ? (100 * input.leadsContacted) / n : 50;
  const speed =
    input.avgResponseDelayHours != null && Number.isFinite(input.avgResponseDelayHours)
      ? hourScore(input.avgResponseDelayHours)
      : 50;
  /** Gentle volume curve — saturates so busy brokers are not infinitely rewarded */
  const volumeBoost = clamp(30 + Math.min(n, 40) * 1.75, 30, 100);
  const raw = contactRate * 0.48 + speed * 0.32 + volumeBoost * 0.2;
  return clamp(Math.round(raw), 0, 100);
}

export function deriveConversionScore(input: BrokerPerformanceMetricsInput): number {
  const lc = input.leadsContacted;
  const lr = input.leadsResponded;
  const mm = input.meetingsMarked;
  const won = input.wonDeals;
  const lost = input.lostDeals;
  const decided = won + lost;

  const progressionContact =
    lc > 0 ? clamp((100 * lr) / lc, 0, 100) : 50;
  const progressionMeeting =
    lr > 0 ? clamp((100 * mm) / lr, 0, 100) : lr === 0 && lc === 0 ? 50 : 45;

  let winSignal = 50;
  if (decided >= 3) {
    winSignal = clamp((100 * won) / decided, 0, 100);
  } else if (decided > 0) {
    winSignal = clamp(48 + (47 * won) / decided, 0, 100);
  } else if (input.leadsAssigned > 0) {
    /** No closes yet — pipeline depth proxy only */
    winSignal = clamp(42 + (28 * mm) / input.leadsAssigned, 0, 100);
  }

  const raw = progressionContact * 0.42 + progressionMeeting * 0.33 + winSignal * 0.25;
  return clamp(Math.round(raw), 0, 100);
}

export function deriveDisciplineScore(input: BrokerPerformanceMetricsInput): number {
  const due = input.followUpsDue;
  const done = input.followUpsCompleted;
  const denom = due + done;
  if (denom <= 0) {
    if (input.leadsContacted <= 0) return 50;
    /** Nothing overdue & no follow-up timestamps — neutral-positive */
    return due === 0 ? 72 : 50;
  }
  const ratio = (100 * done) / denom;
  return clamp(Math.round(ratio * 0.92 + (due === 0 ? 8 : 0)), 0, 100);
}

export function deriveOverallScore(activity: number, conversion: number, discipline: number): number {
  const v = activity * 0.28 + conversion * 0.38 + discipline * 0.34;
  return clamp(Math.round(v), 0, 100);
}

export function classifyExecutionBand(
  overall: number,
  confidence: BrokerPerformanceConfidence,
): BrokerExecutionBand {
  if (confidence === "insufficient") return "insufficient_data";
  if (overall >= 88) return "elite";
  if (overall >= 74) return "strong";
  if (overall >= 52) return "healthy";
  return "weak";
}

export function scoreBrokerPerformanceMetrics(input: BrokerPerformanceMetricsInput): BrokerPerformanceMetrics {
  const confidenceLevel = deriveConfidence(input.leadsAssigned);
  const w = confidenceBlendWeight(confidenceLevel);

  let activityScore = deriveActivityScore(input);
  let conversionScore = deriveConversionScore(input);
  let disciplineScore = deriveDisciplineScore(input);

  activityScore = blendTowardNeutral(activityScore, w);
  conversionScore = blendTowardNeutral(conversionScore, w);
  disciplineScore = blendTowardNeutral(disciplineScore, w);

  let overallScore = deriveOverallScore(activityScore, conversionScore, disciplineScore);
  if (confidenceLevel === "insufficient") {
    overallScore = blendTowardNeutral(overallScore, 0.45);
  }

  const executionBand = classifyExecutionBand(overallScore, confidenceLevel);

  return {
    ...input,
    activityScore: clamp(activityScore, 0, 100),
    conversionScore: clamp(conversionScore, 0, 100),
    disciplineScore: clamp(disciplineScore, 0, 100),
    overallScore: clamp(overallScore, 0, 100),
    confidenceLevel,
    executionBand,
  };
}
