/**
 * Ads Autopilot V8 Phase D — primary path routing (additive).
 * Legacy builder remains; V8 primary is optional behind FEATURE_ADS_AUTOPILOT_V8_PRIMARY_V1.
 */
import { adsAiAutomationFlags } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import type { ProposedAction } from "../ai-autopilot.types";
import { buildProposedActionsAdsAutomationLoop } from "./ads-automation-loop.autopilot.adapter.helpers";
import { buildAdsAutopilotComparisonMetrics } from "./ads-automation-loop.autopilot.adapter.influence";
import {
  buildV8PrimaryProposedActionsAdsAutomationLoop,
  compareAdsAutopilotProposalSets,
  scheduleAdsAutopilotShadowObservationFromResults,
} from "./ads-automation-loop.autopilot.adapter.shadow";
import {
  getAdsAutopilotV8MonitoringSnapshot,
  recordV8PrimaryOutcome,
  recordV8PrimaryPathLog,
} from "./ads-automation-loop.autopilot.adapter.monitoring";

const ADAPTER_NS = "[ads:autopilot:adapter]";
const NS_COMP = "[ads:v8:comparison]";
const MAX_PRIMARY_ACTIONS = 280;

/** Lightweight comparison observability when V8 is primary (does not replace shadow pipeline). */
function logPrimaryComparisonObservability(
  userId: string,
  legacy: ProposedAction[],
  v8Primary: ProposedAction[],
  phase: "primary_fallback" | "primary_success",
): void {
  logInfo(NS_COMP, {
    mode: "v8_primary_parallel_observability",
    phase,
    userId: userId || null,
    legacyCount: legacy.length,
    v8PrimaryCount: v8Primary.length,
  });
}

function warnIfFrequentPrimaryFallback(): void {
  const s = getAdsAutopilotV8MonitoringSnapshot();
  const total = s.v8PrimarySuccessCount + s.v8PrimaryFallbackCount;
  if (total >= 5 && s.v8PrimaryFallbackCount / total > 0.45) {
    logWarn(ADAPTER_NS, "v8_primary_frequent_fallback_observed", {
      success: s.v8PrimarySuccessCount,
      fallback: s.v8PrimaryFallbackCount,
      recentReasons: s.recentPrimaryFallbackReasons,
    });
  }
}

/** Structural validation before accepting V8 primary output. */
export function validateV8PrimaryProposals(actions: unknown): { ok: boolean; reason?: string } {
  if (!Array.isArray(actions)) return { ok: false, reason: "not_array" };
  if (actions.length > MAX_PRIMARY_ACTIONS) return { ok: false, reason: "too_many_actions" };
  for (const raw of actions) {
    if (!raw || typeof raw !== "object") return { ok: false, reason: "invalid_item" };
    const a = raw as ProposedAction;
    if (typeof a.actionType !== "string" || !a.actionType.trim()) return { ok: false, reason: "missing_actionType" };
    if (typeof a.entityType !== "string" || !a.entityType.trim()) return { ok: false, reason: "missing_entityType" };
    if (a.reasons != null && typeof a.reasons !== "object") return { ok: false, reason: "bad_reasons" };
    if (a.reasons && typeof a.reasons === "object" && "confidence" in a.reasons) {
      const c = (a.reasons as Record<string, unknown>).confidence;
      if (typeof c === "number" && !Number.isFinite(c)) return { ok: false, reason: "non_finite_confidence" };
    }
  }
  return { ok: true };
}

/** Quality guardrails: fallback to legacy when comparison vs legacy is unsafe. */
export function shouldFallbackV8PrimaryOnQuality(
  metrics: ReturnType<typeof buildAdsAutopilotComparisonMetrics>,
): { fallback: boolean; reason?: string } {
  if (metrics.unionKeyCount > 20 && metrics.overlapRate < 0.08 && metrics.onlyInLive + metrics.onlyInShadow > 15) {
    return { fallback: true, reason: "quality_guard_low_overlap_large_drifts" };
  }
  if (metrics.matchedKeyCount >= 4 && metrics.meanAbsConfidenceDelta > 0.5) {
    return { fallback: true, reason: "quality_guard_unstable_confidence" };
  }
  if (metrics.shadowStructuralRisk && metrics.onlyInShadow > 12) {
    return { fallback: true, reason: "quality_guard_shadow_structural_risk" };
  }
  return { fallback: false };
}

/**
 * Phase D router: V8 primary when flag ON, with validation + legacy fallback.
 * Does not remove legacy builder; runs it for fallback and optional diff observability.
 */
export async function buildAdsAutopilotProposalsWithV8Routing(userId: string): Promise<ProposedAction[]> {
  const legacyPromise = buildProposedActionsAdsAutomationLoop();

  let v8Primary: ProposedAction[];
  try {
    v8Primary = await buildV8PrimaryProposedActionsAdsAutomationLoop();
  } catch (e) {
    const legacy = await legacyPromise;
    const msg = e instanceof Error ? e.message : String(e);
    recordV8PrimaryOutcome("fallback", "v8_primary_throw");
    recordV8PrimaryPathLog("v8_primary_fallback_legacy");
    logWarn(ADAPTER_NS, "v8_primary_builder_failed", { userId: userId || null, message: msg });
    logInfo(ADAPTER_NS, {
      path: "v8_primary_fallback_legacy",
      reason: "v8_primary_throw",
      userId: userId || null,
    });
    if (adsAiAutomationFlags.adsAutopilotShadowModeV1) {
      scheduleAdsAutopilotShadowObservationFromResults({ userId, live: legacy, shadow: [] });
    }
    warnIfFrequentPrimaryFallback();
    return legacy;
  }

  const structural = validateV8PrimaryProposals(v8Primary);
  if (!structural.ok) {
    const legacy = await legacyPromise;
    recordV8PrimaryOutcome("fallback", structural.reason ?? "structural_invalid");
    recordV8PrimaryPathLog("v8_primary_fallback_legacy");
    logWarn(ADAPTER_NS, "v8_primary_validation_failed", {
      userId: userId || null,
      reason: structural.reason,
    });
    logInfo(ADAPTER_NS, {
      path: "v8_primary_fallback_legacy",
      reason: structural.reason,
      userId: userId || null,
    });
    if (adsAiAutomationFlags.adsAutopilotShadowModeV1) {
      scheduleAdsAutopilotShadowObservationFromResults({ userId, live: legacy, shadow: v8Primary });
    }
    logPrimaryComparisonObservability(userId, legacy, v8Primary, "primary_fallback");
    warnIfFrequentPrimaryFallback();
    return legacy;
  }

  const legacy = await legacyPromise;

  if (v8Primary.length === 0 && legacy.length > 0) {
    recordV8PrimaryOutcome("fallback", "empty_v8_unexpected");
    recordV8PrimaryPathLog("v8_primary_fallback_legacy");
    logWarn(ADAPTER_NS, "v8_primary_empty_unexpected", {
      userId: userId || null,
      legacyCount: legacy.length,
    });
    logInfo(ADAPTER_NS, {
      path: "v8_primary_fallback_legacy",
      reason: "empty_v8_unexpected",
      userId: userId || null,
    });
    if (adsAiAutomationFlags.adsAutopilotShadowModeV1) {
      scheduleAdsAutopilotShadowObservationFromResults({ userId, live: legacy, shadow: v8Primary });
    }
    logPrimaryComparisonObservability(userId, legacy, v8Primary, "primary_fallback");
    warnIfFrequentPrimaryFallback();
    return legacy;
  }

  const diff = compareAdsAutopilotProposalSets(legacy, v8Primary);
  const metrics = buildAdsAutopilotComparisonMetrics(legacy, v8Primary, diff);
  const qg = shouldFallbackV8PrimaryOnQuality(metrics);

  if (qg.fallback) {
    recordV8PrimaryOutcome("fallback", qg.reason ?? "quality");
    recordV8PrimaryPathLog("v8_primary_fallback_legacy");
    logWarn(ADAPTER_NS, "v8_primary_quality_fallback", {
      userId: userId || null,
      reason: qg.reason,
      overlapRate: metrics.overlapRate,
      meanAbsConfidenceDelta: metrics.meanAbsConfidenceDelta,
    });
    logInfo(ADAPTER_NS, {
      path: "v8_primary_fallback_legacy",
      reason: qg.reason,
      userId: userId || null,
    });
    if (adsAiAutomationFlags.adsAutopilotShadowModeV1) {
      scheduleAdsAutopilotShadowObservationFromResults({ userId, live: legacy, shadow: v8Primary });
    }
    logPrimaryComparisonObservability(userId, legacy, v8Primary, "primary_fallback");
    warnIfFrequentPrimaryFallback();
    return legacy;
  }

  recordV8PrimaryOutcome("success");
  recordV8PrimaryPathLog("v8_primary");
  logInfo(ADAPTER_NS, {
    path: "v8_primary",
    userId: userId || null,
    v8Count: v8Primary.length,
    legacyCount: legacy.length,
    overlapRate: metrics.overlapRate,
    divergenceRate: metrics.divergenceRate,
  });

  if (metrics.weakComparison || metrics.meanAbsConfidenceDelta > 0.25) {
    logWarn(ADAPTER_NS, "v8_primary_observability_high_divergence", {
      userId: userId || null,
      weakComparison: metrics.weakComparison,
      meanAbsConfidenceDelta: metrics.meanAbsConfidenceDelta,
      onlyInLive: metrics.onlyInLive,
      onlyInShadow: metrics.onlyInShadow,
    });
  }

  if (v8Primary.length > 220) {
    logWarn(ADAPTER_NS, "v8_primary_action_count_unusual_observed", {
      userId: userId || null,
      v8Count: v8Primary.length,
      legacyCount: legacy.length,
    });
  }

  if (adsAiAutomationFlags.adsAutopilotShadowModeV1) {
    scheduleAdsAutopilotShadowObservationFromResults({ userId, live: legacy, shadow: v8Primary });
  }
  logPrimaryComparisonObservability(userId, legacy, v8Primary, "primary_success");

  return v8Primary;
}
