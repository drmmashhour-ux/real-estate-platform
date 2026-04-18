/**
 * V8 controlled influence — bounded scoring/tags from shadow comparison only.
 * Never adds, removes, or replaces actions; live builder remains source of truth.
 */
import { logInfo, logWarn } from "@/lib/logger";
import type { ProposedAction } from "../ai-autopilot.types";
import {
  compareAdsAutopilotProposalSets,
  getAdsAutopilotProposalKey,
  type AdsAutopilotShadowDiff,
} from "./ads-automation-loop.autopilot.adapter.shadow";

const NS = "[ads:v8:influence]";

/** Max relative swing on `reasons.confidence` (±15%). */
const MAX_CONF_MULTIPLIER_DELTA = 0.15;
const BOOST_MULT = 1 + MAX_CONF_MULTIPLIER_DELTA * 0.85;
const DOWN_MULT = 1 - MAX_CONF_MULTIPLIER_DELTA * 0.85;

function confidenceFromReasons(r: Record<string, unknown>): number | null {
  const c = r.confidence;
  return typeof c === "number" && Number.isFinite(c) ? c : null;
}

function cloneActions(actions: ProposedAction[]): ProposedAction[] {
  return JSON.parse(JSON.stringify(actions)) as ProposedAction[];
}

export type AdsAutopilotComparisonMetrics = {
  overlapRate: number;
  /** Normalized mean |Δconfidence| on matched keys (0–1 scale). */
  divergenceRate: number;
  meanAbsConfidenceDelta: number;
  maxAbsConfidenceDelta: number;
  onlyInLive: number;
  onlyInShadow: number;
  matchedKeyCount: number;
  unionKeyCount: number;
  /** When true, `applyV8Influence` must not adjust scores (Phase B parity). */
  weakComparison: boolean;
  /** Shadow-side structural risk (extra proposals vs live). */
  shadowStructuralRisk: boolean;
};

export function buildAdsAutopilotComparisonMetrics(
  live: ProposedAction[],
  shadow: ProposedAction[],
  diff: AdsAutopilotShadowDiff,
): AdsAutopilotComparisonMetrics {
  const ol = diff.onlyInLive.length;
  const os = diff.onlyInShadow.length;
  const nLive = live.length;
  const nShadow = shadow.length;
  const matched = Math.max(0, Math.min(nLive - ol, nShadow - os));
  const union = matched + ol + os;
  const overlapRate = union > 0 ? matched / union : nLive === 0 && nShadow === 0 ? 1 : 0;

  const pairedDeltas = diff.confidencePairs
    .filter((p) => p.live != null && p.shadow != null && p.delta != null)
    .map((p) => Math.abs(p.delta as number));
  const meanAbsConfidenceDelta =
    pairedDeltas.length > 0 ? pairedDeltas.reduce((a, b) => a + b, 0) / pairedDeltas.length : 0;
  const maxAbsConfidenceDelta = pairedDeltas.length > 0 ? Math.max(...pairedDeltas) : 0;
  const divergenceRate = Math.min(1, meanAbsConfidenceDelta / 0.5);

  const weakComparison =
    overlapRate < 0.5 ||
    meanAbsConfidenceDelta > 0.22 ||
    maxAbsConfidenceDelta > 0.42 ||
    ol > 0 ||
    os > 0;

  return {
    overlapRate: Number(overlapRate.toFixed(6)),
    divergenceRate: Number(divergenceRate.toFixed(6)),
    meanAbsConfidenceDelta: Number(meanAbsConfidenceDelta.toFixed(8)),
    maxAbsConfidenceDelta: Number(maxAbsConfidenceDelta.toFixed(8)),
    onlyInLive: ol,
    onlyInShadow: os,
    matchedKeyCount: matched,
    unionKeyCount: union,
    weakComparison,
    shadowStructuralRisk: os > 0,
  };
}

export type V8InfluenceStats = {
  total: number;
  influenced: number;
  boost: number;
  downrank: number;
  monitorOnly: number;
  pctInfluenced: number;
};

export type V8InfluenceResult = {
  actions: ProposedAction[];
  stats: V8InfluenceStats;
  warnings: string[];
};

/** Optional cap: max fraction of rows that may receive any influence (default 1 = no cap). Phase C overlay uses ~0.28. */
export type ApplyV8InfluenceOptions = {
  maxAdjustedFraction?: number;
};

function isCriticalAdsLoopAction(a: ProposedAction): boolean {
  return a.entityId === "loop_review";
}

/**
 * Applies bounded shadow-derived nudges to cloned live actions only.
 * Does not add/remove/replace rows; preserves live ordering.
 */
export function applyV8Influence(
  liveActions: ProposedAction[],
  shadowActions: ProposedAction[],
  comparisonMetrics: AdsAutopilotComparisonMetrics,
  diff?: AdsAutopilotShadowDiff,
  options?: ApplyV8InfluenceOptions,
): V8InfluenceResult {
  const warnings: string[] = [];
  const d = diff ?? compareAdsAutopilotProposalSets(liveActions, shadowActions);
  const maxFrac = options?.maxAdjustedFraction ?? 1;
  const maxInfluenced = Math.max(0, Math.ceil(liveActions.length * maxFrac));

  if (liveActions.length === 0) {
    return {
      actions: [],
      stats: { total: 0, influenced: 0, boost: 0, downrank: 0, monitorOnly: 0, pctInfluenced: 0 },
      warnings: [],
    };
  }

  if (comparisonMetrics.weakComparison) {
    return {
      actions: cloneActions(liveActions),
      stats: {
        total: liveActions.length,
        influenced: 0,
        boost: 0,
        downrank: 0,
        monitorOnly: 0,
        pctInfluenced: 0,
      },
      warnings: ["weak_comparison_skipped"],
    };
  }

  const shadowMap = new Map<string, ProposedAction>();
  for (const s of shadowActions) shadowMap.set(getAdsAutopilotProposalKey(s), s);

  const deltaByKey = new Map<string, number>();
  for (const p of d.confidencePairs) {
    if (p.delta != null && Number.isFinite(p.delta)) deltaByKey.set(p.key, p.delta);
  }

  const out = cloneActions(liveActions);
  let boost = 0;
  let downrank = 0;
  let monitorOnly = 0;
  let influenced = 0;

  for (let i = 0; i < out.length; i++) {
    if (influenced >= maxInfluenced) {
      break;
    }
    const a = out[i];
    const key = getAdsAutopilotProposalKey(a);
    const shadowA = shadowMap.get(key);
    const reasons = { ...a.reasons } as Record<string, unknown>;
    const liveC = confidenceFromReasons(reasons);
    const shadowC = shadowA ? confidenceFromReasons(shadowA.reasons as Record<string, unknown>) : null;
    const delta = deltaByKey.get(key) ?? (liveC != null && shadowC != null ? shadowC - liveC : null);
    const absDelta = delta != null ? Math.abs(delta) : null;

    const critical = isCriticalAdsLoopAction(a);

    let tag: "boost" | "downrank" | "monitor_only" | null = null;
    let mult = 1;

    const lowShadowConf = shadowC != null && shadowC < 0.45;
    const mediumDivergence = absDelta != null && absDelta > 0.1 && absDelta <= 0.15;
    const strongDisagree = absDelta != null && absDelta > 0.15;
    const shadowPessimism = liveC != null && shadowC != null && shadowC < liveC - 0.18;

    const monitor =
      (shadowA && (lowShadowConf || mediumDivergence)) ||
      (comparisonMetrics.divergenceRate > 0.35 && absDelta != null && absDelta > 0.08);

    if (monitor && !strongDisagree) {
      tag = "monitor_only";
      reasons.v8InfluenceTag = "monitor_only";
      reasons.v8InfluenceKind = "monitor";
      if (liveC != null) reasons.v8ConfidenceBefore = liveC;
      monitorOnly++;
      influenced++;
      out[i] = {
        ...a,
        reasons,
        recommendedPayload: {
          ...(a.recommendedPayload ?? {}),
          v8Influence: {
            tag: "monitor_only" as const,
            overlapRate: comparisonMetrics.overlapRate,
            meanAbsConfidenceDelta: comparisonMetrics.meanAbsConfidenceDelta,
          },
        },
      };
      continue;
    }

    const agreeHigh =
      shadowA &&
      liveC != null &&
      shadowC != null &&
      absDelta != null &&
      absDelta <= 0.08 &&
      Math.min(liveC, shadowC) >= 0.58 &&
      shadowC >= liveC - 0.03;

    const shouldDownrank = !critical && shadowA && ((absDelta != null && absDelta > 0.15) || shadowPessimism);

    if (shouldDownrank) {
      tag = "downrank";
      mult = DOWN_MULT;
      downrank++;
      influenced++;
    } else if (agreeHigh && !critical) {
      tag = "boost";
      mult = BOOST_MULT;
      boost++;
      influenced++;
    } else if (agreeHigh && critical) {
      tag = "boost";
      mult = Math.min(1.1, BOOST_MULT);
      boost++;
      influenced++;
    }

    if (tag && tag !== "monitor_only" && liveC != null) {
      const next = Math.max(0, Math.min(1, Number((liveC * mult).toFixed(6))));
      const maxSwing = liveC * MAX_CONF_MULTIPLIER_DELTA;
      const clamped =
        mult > 1
          ? Math.min(next, liveC + maxSwing)
          : Math.max(next, liveC - maxSwing);
      reasons.confidence = critical ? Math.max(clamped, liveC - maxSwing * 0.5) : clamped;
    }

    if (tag) {
      reasons.v8InfluenceTag = tag === "monitor_only" ? "monitor_only" : tag;
      reasons.v8InfluenceKind = tag;
      if (liveC != null && typeof reasons.confidence === "number") {
        reasons.v8ConfidenceBefore = liveC;
      }
    }

    const payload =
      tag
        ? {
            ...(a.recommendedPayload ?? {}),
            v8Influence: {
              tag,
              overlapRate: comparisonMetrics.overlapRate,
              meanAbsConfidenceDelta: comparisonMetrics.meanAbsConfidenceDelta,
            },
          }
        : a.recommendedPayload;

    out[i] = { ...a, reasons, recommendedPayload: payload };
  }

  const total = out.length;
  const pctInfluenced = total > 0 ? Number(((100 * influenced) / total).toFixed(2)) : 0;

  if (comparisonMetrics.overlapRate < 0.65 && influenced > 0) {
    warnings.push("low_overlap_with_influence");
  }
  if (comparisonMetrics.meanAbsConfidenceDelta > 0.18 && influenced > 0) {
    warnings.push("high_divergence_with_influence");
  }
  if (pctInfluenced > 60) {
    warnings.push("high_fraction_influenced");
  }
  if (comparisonMetrics.maxAbsConfidenceDelta > 0.3) {
    warnings.push("confidence_unstable");
  }

  for (const w of warnings) {
    logWarn(NS, w, {
      overlapRate: comparisonMetrics.overlapRate,
      meanAbsConfidenceDelta: comparisonMetrics.meanAbsConfidenceDelta,
      influenced,
      total,
    });
  }

  return {
    actions: out,
    stats: { total, influenced, boost, downrank, monitorOnly, pctInfluenced },
    warnings,
  };
}

