/**
 * V8 SHADOW MODE — Ads automation loop autopilot proposals.
 * Runs an experimental proposal path in parallel with live; never mutates live output.
 */
import { adsAiAutomationFlags } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import { prisma } from "@/lib/db";
import {
  recordShadowPersistenceFailure,
  recordShadowPersistenceSuccess,
  recordShadowPipelineCompleted,
  recordShadowPipelineFailed,
  recordShadowScheduleInvocation,
} from "./ads-automation-loop.autopilot.adapter.monitoring";
import type { ProposedAction } from "../ai-autopilot.types";
import { buildProposedActionsAdsAutomationLoop } from "./ads-automation-loop.autopilot.adapter.helpers";
import {
  buildAdsV8ComparisonReport,
  getAdsV8ComparisonAggregationSnapshot,
  recordAdsV8ComparisonAggregation,
} from "./ads-automation-loop.autopilot.adapter.comparison";

const NS = "[ads:autopilot:shadow]";
const NS_COMP = "[ads:v8:comparison]";

function confidenceFromReasons(r: Record<string, unknown>): number | null {
  const c = r.confidence;
  return typeof c === "number" && Number.isFinite(c) ? c : null;
}

export function getAdsAutopilotProposalKey(a: ProposedAction): string {
  return `${a.actionType}|${a.entityId ?? ""}|${a.entityType}`;
}

function proposalKey(a: ProposedAction): string {
  return getAdsAutopilotProposalKey(a);
}

export type AdsAutopilotShadowDiff = {
  onlyInLive: string[];
  onlyInShadow: string[];
  confidencePairs: Array<{
    key: string;
    live: number | null;
    shadow: number | null;
    delta: number | null;
  }>;
  aligned: boolean;
};

/**
 * Structural + confidence comparison for analysis (deterministic ordering by key).
 */
export function compareAdsAutopilotProposalSets(
  live: ProposedAction[],
  shadow: ProposedAction[],
): AdsAutopilotShadowDiff {
  const liveMap = new Map<string, ProposedAction>();
  const shadowMap = new Map<string, ProposedAction>();
  for (const a of live) liveMap.set(proposalKey(a), a);
  for (const a of shadow) shadowMap.set(proposalKey(a), a);

  const liveKeys = new Set(liveMap.keys());
  const shadowKeys = new Set(shadowMap.keys());
  const onlyInLive = [...liveKeys].filter((k) => !shadowKeys.has(k)).sort();
  const onlyInShadow = [...shadowKeys].filter((k) => !liveKeys.has(k)).sort();

  const allKeys = new Set([...liveKeys, ...shadowKeys]);
  const confidencePairs: AdsAutopilotShadowDiff["confidencePairs"] = [];
  for (const key of [...allKeys].sort()) {
    const l = liveMap.get(key);
    const s = shadowMap.get(key);
    const lc = l ? confidenceFromReasons(l.reasons) : null;
    const sc = s ? confidenceFromReasons(s.reasons) : null;
    let delta: number | null = null;
    if (lc != null && sc != null) delta = Number((sc - lc).toFixed(6));
    confidencePairs.push({ key, live: lc, shadow: sc, delta });
  }

  const aligned =
    onlyInLive.length === 0 &&
    onlyInShadow.length === 0 &&
    confidencePairs.every((p) => {
      if (p.live == null && p.shadow == null) return true;
      if (p.live == null || p.shadow == null) return false;
      return Math.abs(p.live - p.shadow) < 1e-9;
    });

  return { onlyInLive, onlyInShadow, confidencePairs, aligned };
}

function aggregateConfidenceSummary(pairs: AdsAutopilotShadowDiff["confidencePairs"]) {
  const deltas = pairs.map((p) => p.delta).filter((d): d is number => d != null && Number.isFinite(d));
  if (deltas.length === 0) {
    return { meanAbsDelta: 0, maxAbsDelta: 0, sampleCount: 0 };
  }
  const abs = deltas.map((d) => Math.abs(d));
  const meanAbsDelta = abs.reduce((a, b) => a + b, 0) / abs.length;
  const maxAbsDelta = Math.max(...abs);
  return { meanAbsDelta: Number(meanAbsDelta.toFixed(8)), maxAbsDelta: Number(maxAbsDelta.toFixed(8)), sampleCount: deltas.length };
}

/**
 * Experimental shadow proposal builder — today mirrors live for infra validation.
 * Replace internals here to trial new ranking/confidence without affecting `buildProposedActionsAdsAutomationLoop`.
 */
export async function buildShadowProposedActionsAdsAutomationLoop(): Promise<ProposedAction[]> {
  return buildProposedActionsAdsAutomationLoop();
}

/**
 * V8 Phase D primary proposal path — hook for future divergence from legacy/shadow parity.
 * Today mirrors shadow builder; callers must still validate + fallback to legacy.
 */
export async function buildV8PrimaryProposedActionsAdsAutomationLoop(): Promise<ProposedAction[]> {
  return buildShadowProposedActionsAdsAutomationLoop();
}

async function persistShadowObservation(input: {
  userId: string;
  live: ProposedAction[];
  shadow: ProposedAction[];
  diff: AdsAutopilotShadowDiff;
  comparisonPayload?: Record<string, unknown>;
}): Promise<void> {
  if (!adsAiAutomationFlags.adsAutopilotShadowPersistenceV1) return;

  const confidenceSummary = aggregateConfidenceSummary(input.diff.confidencePairs);

  await prisma.adsAutopilotShadowObservation.create({
    data: {
      userId: input.userId || null,
      liveProposalCount: input.live.length,
      shadowProposalCount: input.shadow.length,
      aligned: input.diff.aligned,
      confidenceSummary: confidenceSummary as object,
      diffPayload: {
        onlyInLive: input.diff.onlyInLive,
        onlyInShadow: input.diff.onlyInShadow,
        confidencePairs: input.diff.confidencePairs,
      } as object,
      metadata: {
        source: "ads-automation-loop.autopilot.adapter.shadow",
        version: 1,
        ...(input.comparisonPayload ? { v8Comparison: input.comparisonPayload } : {}),
      },
    },
  });
  recordShadowPersistenceSuccess();
}

export async function runAdsAutopilotShadowObservationPipeline(
  userId: string,
  live: ProposedAction[],
  shadow: ProposedAction[],
): Promise<void> {
  const diff = compareAdsAutopilotProposalSets(live, shadow);
  const summary = aggregateConfidenceSummary(diff.confidencePairs);

  const comparisonReport = buildAdsV8ComparisonReport({ userId, live, shadow });
  recordAdsV8ComparisonAggregation(comparisonReport);
  logInfo(NS_COMP, {
    ...comparisonReport.logPayload,
    aggregation: getAdsV8ComparisonAggregationSnapshot(),
  });
  for (const w of comparisonReport.warnings) {
    logWarn(NS_COMP, w.code, { detail: w.detail, runId: comparisonReport.runId, userId: userId || null });
  }

  logInfo(NS, {
    userId: userId || null,
    liveCount: live.length,
    shadowCount: shadow.length,
    aligned: diff.aligned,
    meanAbsConfidenceDelta: summary.meanAbsDelta,
    maxAbsConfidenceDelta: summary.maxAbsDelta,
    onlyInLive: diff.onlyInLive.length,
    onlyInShadow: diff.onlyInShadow.length,
  });

  try {
    await persistShadowObservation({
      userId,
      live,
      shadow,
      diff,
      comparisonPayload: comparisonReport.persistencePayload,
    });
  } catch (e) {
    recordShadowPersistenceFailure();
    logWarn(NS, "shadow persistence failed (live output unaffected)", {
      message: e instanceof Error ? e.message : String(e),
    });
  }

  recordShadowPipelineCompleted();
}

/**
 * Phase B observation using already-built live + shadow (avoids a second shadow build when influence awaited both).
 */
export function scheduleAdsAutopilotShadowObservationFromResults(input: {
  userId: string;
  live: ProposedAction[];
  shadow: ProposedAction[];
}): void {
  if (!adsAiAutomationFlags.adsAutopilotShadowModeV1) return;
  recordShadowScheduleInvocation();
  void runAdsAutopilotShadowObservationPipeline(input.userId, input.live, input.shadow).catch((e) => {
    recordShadowPipelineFailed();
    logWarn(NS, "shadow observation failed (live output unaffected)", {
      message: e instanceof Error ? e.message : String(e),
    });
  });
}

/**
 * Starts shadow pipeline in parallel with the live promise; resolves live first for callers.
 * Live return value is never replaced by shadow results.
 */
export function scheduleAdsAutopilotShadowObservation(input: {
  userId: string;
  livePromise: Promise<ProposedAction[]>;
}): void {
  if (!adsAiAutomationFlags.adsAutopilotShadowModeV1) return;

  recordShadowScheduleInvocation();
  const shadowPromise = buildShadowProposedActionsAdsAutomationLoop();

  void Promise.all([input.livePromise, shadowPromise])
    .then(([live, shadow]) => runAdsAutopilotShadowObservationPipeline(input.userId, live, shadow))
    .catch((e) => {
      recordShadowPipelineFailed();
      logWarn(NS, "shadow observation failed (live output unaffected)", {
        message: e instanceof Error ? e.message : String(e),
      });
    });
}
