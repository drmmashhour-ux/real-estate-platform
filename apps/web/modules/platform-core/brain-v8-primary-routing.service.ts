/**
 * Brain V8 Phase D — primary presentation path with validation + fallback to Phase C (additive).
 * Does not write to learning/outcomes/weights.
 */
import { oneBrainV8Flags } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import type { BrainSnapshotPayload } from "./brain-snapshot.service";
import {
  applyBrainV8Influence,
  applyBrainV8PresentationOverlay,
  buildBrainV8ComparisonQuality,
  buildShadowObservationFromSnapshot,
} from "./brain-v8-influence.service";
import type { BrainSnapshotWithV8Influence } from "./brain-v8-influence.service";
import type { BrainV8ShadowObservationResult } from "./brain-v8-shadow.types";
import type { BrainV8ComparisonQuality } from "./brain-v8-influence.types";
import {
  recordBrainV8PrimaryOutcome,
  recordBrainV8PrimaryPathLog,
  recordBrainV8PrimarySuccessOutputShape,
  warnIfFrequentPrimaryFallback,
} from "./brain-v8-primary-monitoring.service";

const NS = "[brain:v8:primary]";

function validateBrainV8PrimaryReadiness(
  snapshot: BrainSnapshotPayload,
  shadow: BrainV8ShadowObservationResult,
  quality: BrainV8ComparisonQuality,
): { ok: boolean; reason?: string } {
  if (!Array.isArray(snapshot.recentOutcomes)) return { ok: false, reason: "invalid_snapshot_outcomes" };
  if (snapshot.recentOutcomes.length > 0 && shadow.sampleSize === 0) {
    return { ok: false, reason: "empty_shadow_unexpected" };
  }
  const agg = shadow.aggregate;
  if (!Number.isFinite(agg.meanAbsDeltaFiniteSample)) return { ok: false, reason: "non_finite_shadow_aggregate" };
  if (quality.weakComparison) {
    return { ok: false, reason: "weak_comparison_quality" };
  }
  return { ok: true };
}

function validateBrainV8PrimaryOutput(
  candidate: BrainSnapshotWithV8Influence,
  base: BrainSnapshotPayload,
): { ok: boolean; reason?: string } {
  if (!Array.isArray(candidate.recentOutcomes)) return { ok: false, reason: "candidate_outcomes_invalid" };
  if (candidate.recentOutcomes.length !== base.recentOutcomes.length) {
    return { ok: false, reason: "outcome_count_mismatch" };
  }
  const baseIds = new Set(base.recentOutcomes.map((o) => o.decisionId));
  const candIds = new Set(candidate.recentOutcomes.map((o) => o.decisionId));
  if (baseIds.size !== candIds.size || [...baseIds].some((id) => !candIds.has(id))) {
    return { ok: false, reason: "decision_id_set_mismatch" };
  }
  for (const o of candidate.recentOutcomes) {
    if (typeof o.outcomeScore !== "number" || !Number.isFinite(o.outcomeScore)) {
      return { ok: false, reason: "non_finite_outcome_score" };
    }
  }
  return { ok: true };
}

function logPrimaryDivergenceObservability(base: BrainSnapshotPayload, candidate: BrainSnapshotWithV8Influence): void {
  const baseOrder = base.recentOutcomes.map((o) => o.decisionId).join(",");
  const candOrder = candidate.recentOutcomes.map((o) => o.decisionId).join(",");
  if (baseOrder !== candOrder) {
    logInfo(NS, "brain_v8_primary_order_delta_vs_baseline", {
      reordered: true,
    });
  }
}

/**
 * Single entry for Brain snapshot presentation: Phase C when primary off; validated V8-first when primary on.
 */
export function buildBrainOutputWithV8Routing(snapshot: BrainSnapshotPayload): BrainSnapshotWithV8Influence {
  if (!oneBrainV8Flags.brainV8PrimaryV1) {
    logInfo("[brain:v8:adapter]", { path: "current_brain_phase_c", note: "V8 primary off — Phase C overlay only" });
    return applyBrainV8PresentationOverlay(snapshot);
  }

  try {
    const shadow = buildShadowObservationFromSnapshot(snapshot);
    const quality = buildBrainV8ComparisonQuality(shadow);

    const ready = validateBrainV8PrimaryReadiness(snapshot, shadow, quality);
    if (!ready.ok) {
      recordBrainV8PrimaryOutcome("fallback", ready.reason);
      recordBrainV8PrimaryPathLog("brain_v8_primary_fallback_current");
      logWarn(NS, "brain_v8_primary_readiness_failed", { reason: ready.reason });
      logInfo("[brain:v8:adapter]", {
        path: "brain_v8_primary_fallback_current",
        reason: ready.reason,
      });
      warnIfFrequentPrimaryFallback(NS);
      return applyBrainV8PresentationOverlay(snapshot);
    }

    const candidate = applyBrainV8Influence(snapshot, shadow, quality, { primaryPath: true });
    const post = validateBrainV8PrimaryOutput(candidate, snapshot);
    if (!post.ok) {
      recordBrainV8PrimaryOutcome("fallback", post.reason);
      recordBrainV8PrimaryPathLog("brain_v8_primary_fallback_current");
      logWarn(NS, "brain_v8_primary_output_validation_failed", { reason: post.reason });
      logInfo("[brain:v8:adapter]", {
        path: "brain_v8_primary_fallback_current",
        reason: post.reason,
      });
      warnIfFrequentPrimaryFallback(NS);
      return applyBrainV8PresentationOverlay(snapshot);
    }

    logPrimaryDivergenceObservability(snapshot, candidate);
    recordBrainV8PrimaryOutcome("success");
    recordBrainV8PrimarySuccessOutputShape(snapshot, candidate);
    recordBrainV8PrimaryPathLog("brain_v8_primary");
    logInfo("[brain:v8:adapter]", {
      path: "brain_v8_primary",
      influenced: candidate.brainV8Influence?.stats?.influenced ?? 0,
      applied: candidate.brainV8Influence?.applied ?? false,
    });
    logInfo(NS, { event: "brain_v8_primary_ok" });
    return candidate;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    recordBrainV8PrimaryOutcome("fallback", "v8_primary_throw");
    recordBrainV8PrimaryPathLog("brain_v8_primary_fallback_current");
    logWarn(NS, "brain_v8_primary_throw", { message: msg });
    logInfo("[brain:v8:adapter]", { path: "brain_v8_primary_fallback_current", reason: "v8_primary_throw" });
    warnIfFrequentPrimaryFallback(NS);
    return applyBrainV8PresentationOverlay(snapshot);
  }
}
