/**
 * Ads V8 Phase C — controlled influence overlay (bounded, auditable, instantly disabled via flag upstream).
 * Does not call the live builder; consumes live + shadow insights only.
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { ProposedAction } from "../ai-autopilot.types";
import {
  applyV8Influence,
  buildAdsAutopilotComparisonMetrics,
  type AdsAutopilotComparisonMetrics,
} from "./ads-automation-loop.autopilot.adapter.influence";
import type { AdsAutopilotShadowDiff } from "./ads-automation-loop.autopilot.adapter.shadow";
import { compareAdsAutopilotProposalSets, getAdsAutopilotProposalKey } from "./ads-automation-loop.autopilot.adapter.shadow";

const NS = "[ads:v8:influence]";

export type AdsV8ShadowInsightsInput = {
  shadowActions: ProposedAction[];
  metrics: AdsAutopilotComparisonMetrics;
  diff: AdsAutopilotShadowDiff;
};

export type AdsV8InfluenceConstraints = {
  /** Fraction of rows that may receive any adjustment (default 0.28 ≈ max 28%). */
  maxAdjustedFraction?: number;
};

export type AdsV8InfluenceOverlayMetadata = {
  applied: boolean;
  adjustments: Array<{ key: string; kind: string; detail: string }>;
  skipped: boolean;
  reason?: string;
  /** Aggregate agreement signal 0–1 (overlap-heavy). */
  confidence?: number;
};

function cloneActions(actions: ProposedAction[]): ProposedAction[] {
  return JSON.parse(JSON.stringify(actions)) as ProposedAction[];
}

function confidenceFromReasons(r: Record<string, unknown>): number | null {
  const c = r.confidence;
  return typeof c === "number" && Number.isFinite(c) ? c : null;
}

function aggregateConfidence(m: AdsAutopilotComparisonMetrics): number {
  return Number(
    Math.min(1, Math.max(0, m.overlapRate * (1 - m.meanAbsConfidenceDelta * 0.5))).toFixed(6),
  );
}

/**
 * Quality gate: skip overlay when comparison is unreliable or structurally divergent.
 */
export function shouldSkipAdsV8InfluenceOverlay(
  metrics: AdsAutopilotComparisonMetrics,
  diff: AdsAutopilotShadowDiff,
  liveLen: number,
): { skip: true; reason: string } | { skip: false } {
  if (metrics.weakComparison) {
    return { skip: true, reason: "weak_comparison" };
  }
  if (diff.onlyInLive.length > 0 || diff.onlyInShadow.length > 0) {
    return { skip: true, reason: "structural_mismatch" };
  }
  if (metrics.shadowStructuralRisk) {
    return { skip: true, reason: "shadow_structural_risk" };
  }
  const paired = diff.confidencePairs.filter((p) => p.live != null && p.shadow != null).length;
  if (liveLen > 0 && paired < Math.min(2, liveLen)) {
    return { skip: true, reason: "insufficient_data_points" };
  }
  if (metrics.maxAbsConfidenceDelta > 0.42) {
    return { skip: true, reason: "confidence_unstable" };
  }
  return { skip: false };
}

function validateInfluencedStructure(live: ProposedAction[], influenced: ProposedAction[]): boolean {
  if (live.length !== influenced.length) return false;
  for (let i = 0; i < live.length; i++) {
    const a = live[i];
    const b = influenced[i];
    if (
      a.actionType !== b.actionType ||
      a.entityId !== b.entityId ||
      a.entityType !== b.entityType ||
      a.domain !== b.domain ||
      a.title !== b.title ||
      a.summary !== b.summary ||
      a.severity !== b.severity ||
      a.riskLevel !== b.riskLevel
    ) {
      return false;
    }
  }
  return true;
}

function buildAdjustmentRecords(live: ProposedAction[], influenced: ProposedAction[]): AdsV8InfluenceOverlayMetadata["adjustments"] {
  const adj: AdsV8InfluenceOverlayMetadata["adjustments"] = [];
  for (let i = 0; i < live.length; i++) {
    const lb = confidenceFromReasons(live[i].reasons as Record<string, unknown>);
    const ib = confidenceFromReasons(influenced[i].reasons as Record<string, unknown>);
    const tag = (influenced[i].reasons as Record<string, unknown>).v8InfluenceTag;
    if (tag != null || (lb != null && ib != null && Math.abs(ib - lb) > 1e-9)) {
      adj.push({
        key: getAdsAutopilotProposalKey(live[i]),
        kind: typeof tag === "string" ? tag : "confidence_delta",
        detail:
          lb != null && ib != null
            ? `confidence ${lb.toFixed(4)} → ${ib.toFixed(4)}`
            : typeof tag === "string"
              ? `tag=${tag}`
              : "influence",
      });
    }
  }
  return adj;
}

export type ApplyAdsV8InfluenceOverlayInput = {
  liveActions: ProposedAction[];
  shadowInsights: AdsV8ShadowInsightsInput;
  constraints?: AdsV8InfluenceConstraints;
};

export type ApplyAdsV8InfluenceOverlayResult = {
  influencedActions: ProposedAction[];
  metadata: AdsV8InfluenceOverlayMetadata;
};

/**
 * Bounded influence overlay — never removes rows or changes action identity; only parameters (confidence / tags / payload hints).
 */
export function applyAdsV8InfluenceOverlay(input: ApplyAdsV8InfluenceOverlayInput): ApplyAdsV8InfluenceOverlayResult {
  const { liveActions, shadowInsights, constraints } = input;
  const { shadowActions, metrics, diff } = shadowInsights;
  const maxFrac = constraints?.maxAdjustedFraction ?? 0.28;
  const conf = aggregateConfidence(metrics);

  const gate = shouldSkipAdsV8InfluenceOverlay(metrics, diff, liveActions.length);
  if (gate.skip) {
    logInfo(NS, {
      applied: false,
      skipped: true,
      reason: gate.reason,
      adjustmentsCount: 0,
      confidence: conf,
    });
    return {
      influencedActions: liveActions,
      metadata: {
        applied: false,
        adjustments: [],
        skipped: true,
        reason: gate.reason,
        confidence: conf,
      },
    };
  }

  const result = applyV8Influence(liveActions, shadowActions, metrics, diff, { maxAdjustedFraction: maxFrac });

  if (!validateInfluencedStructure(liveActions, result.actions)) {
    logWarn(NS, "overlay_structure_validation_failed", { confidence: conf });
    return {
      influencedActions: cloneActions(liveActions),
      metadata: {
        applied: false,
        adjustments: [],
        skipped: false,
        reason: "validation_failed",
        confidence: conf,
      },
    };
  }

  const adjustments = buildAdjustmentRecords(liveActions, result.actions);
  const applied = result.stats.influenced > 0;

  logInfo(NS, {
    applied,
    skipped: false,
    adjustmentsCount: adjustments.length,
    influencedRows: result.stats.influenced,
    boost: result.stats.boost,
    downrank: result.stats.downrank,
    monitorOnly: result.stats.monitorOnly,
    pctInfluenced: result.stats.pctInfluenced,
    confidence: conf,
    overlapRate: metrics.overlapRate,
    meanAbsConfidenceDelta: metrics.meanAbsConfidenceDelta,
    warnings: result.warnings.length ? result.warnings : undefined,
  });

  return {
    influencedActions: result.actions,
    metadata: {
      applied,
      adjustments,
      skipped: false,
      confidence: conf,
    },
  };
}

/**
 * Convenience: build metrics + diff when caller only has live + shadow arrays.
 */
export function buildAdsV8ShadowInsightsFromProposalSets(
  live: ProposedAction[],
  shadow: ProposedAction[],
): AdsV8ShadowInsightsInput {
  const diff = compareAdsAutopilotProposalSets(live, shadow);
  const metrics = buildAdsAutopilotComparisonMetrics(live, shadow, diff);
  return { shadowActions: shadow, metrics, diff };
}
