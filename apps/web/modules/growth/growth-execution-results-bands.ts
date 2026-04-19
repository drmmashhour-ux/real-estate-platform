/**
 * Deterministic outcome bands — exported for tests; conservative thresholds.
 */

import type { OutcomeBand } from "@/modules/growth/growth-execution-results.types";

/** Minimum monetization events in a window to avoid thin broker deltas. */
export const BROKER_WINDOW_MIN_EVENTS = 3;

/** Minimum total AI telemetry rows in window to avoid “global sparse” flag. */
export const AI_TELEMETRY_SPARSE_THRESHOLD = 2;

export function bandAiUsage(params: {
  copied: boolean;
  locallyApproved: boolean;
  ignored: boolean;
  viewed: boolean;
  hasAnyTelemetry: boolean;
}): OutcomeBand {
  if (!params.hasAnyTelemetry) return "insufficient_data";
  if (params.locallyApproved || params.copied) return "positive";
  if (params.ignored && !params.copied && !params.locallyApproved) return "neutral";
  if (params.viewed && !params.ignored) return "neutral";
  return "neutral";
}

export function bandBrokerProxy(params: {
  leadEventsRecent: number;
  leadEventsPrior: number;
  tier: "standard" | "preferred" | "elite";
}): OutcomeBand {
  const total = params.leadEventsRecent + params.leadEventsPrior;
  if (total < BROKER_WINDOW_MIN_EVENTS) return "insufficient_data";
  const delta = params.leadEventsRecent - params.leadEventsPrior;
  if (delta >= 1 && (params.tier === "preferred" || params.tier === "elite")) return "positive";
  if (delta <= -2) return "negative";
  return "neutral";
}

export function bandScaleDelta(params: {
  delta: number;
  targetType: "leads" | "brokers" | "revenue";
  priorValue: number;
  currentValue: number;
}): OutcomeBand {
  const { delta, targetType } = params;
  if (targetType === "brokers") {
    if (params.currentValue === 0 && params.priorValue === 0) return "insufficient_data";
    if (delta > 0) return "positive";
    if (delta < 0) return "negative";
    return "neutral";
  }
  if (targetType === "revenue") {
    if (params.currentValue === 0 && params.priorValue === 0) return "insufficient_data";
    if (delta > 20) return "positive";
    if (delta < -20) return "negative";
    return "neutral";
  }
  // leads
  if (params.currentValue === 0 && params.priorValue === 0) return "insufficient_data";
  if (delta >= 3) return "positive";
  if (delta <= -3) return "negative";
  return "neutral";
}
