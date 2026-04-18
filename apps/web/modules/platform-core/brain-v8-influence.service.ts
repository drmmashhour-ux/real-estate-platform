/**
 * Brain V8 Phase C — bounded presentation influence on snapshot copies only.
 * Does not alter stored outcomes, weights, or learning; response-layer overlay.
 */
import { oneBrainV8Flags } from "@/config/feature-flags";
import { logInfo, logWarn } from "@/lib/logger";
import type { BrainSnapshotPayload } from "./brain-snapshot.service";
import { aggregateShadowDeltas, buildShadowRowsFromOutcomes } from "./brain-v8-shadow-evaluator.service";
import type { BrainV8ShadowObservationResult, BrainV8ShadowOutcomeRow } from "./brain-v8-shadow.types";
import type { BrainV8ComparisonQuality, BrainV8InfluenceLayer, BrainV8InfluenceTag } from "./brain-v8-influence.types";
import type { BrainTimelineEntry } from "./brain-snapshot.service";
import type { BrainDecisionOutcomeDTO } from "./brain-v2.repository";

const NS = "[brain:v8:influence]";
const MAX_PRESENTATION_NUDGE = 0.12;
const MAX_INFLUENCED_FRACTION = 0.42;

export function buildShadowObservationFromSnapshot(snapshot: BrainSnapshotPayload): BrainV8ShadowObservationResult {
  const outcomes = snapshot.recentOutcomes.slice(0, 24);
  const rows = buildShadowRowsFromOutcomes(outcomes);
  return {
    observedAt: new Date().toISOString(),
    sampleSize: rows.length,
    rows,
    aggregate: aggregateShadowDeltas(rows),
    notes: [],
  };
}

export function buildBrainV8ComparisonQuality(shadow: BrainV8ShadowObservationResult): BrainV8ComparisonQuality {
  const n = shadow.sampleSize;
  const agg = shadow.aggregate;
  const insufficientRatio = n > 0 ? agg.insufficientEvidenceCount / n : 1;
  const reviewRatio = n > 0 ? agg.reviewCount / n : 1;
  const weakComparison =
    n < 3 ||
    agg.meanAbsDeltaFiniteSample > 0.26 ||
    insufficientRatio > 0.48 ||
    reviewRatio > 0.72;
  return {
    weakComparison,
    sampleSize: n,
    meanAbsDelta: agg.meanAbsDeltaFiniteSample,
    insufficientRatio,
    reviewRatio,
  };
}

function isCriticalOutcome(o: BrainDecisionOutcomeDTO): boolean {
  return o.outcomeType === "NEGATIVE" || (typeof o.outcomeScore === "number" && o.outcomeScore <= -0.35);
}

function nudgeForRow(
  o: BrainDecisionOutcomeDTO,
  shadow: BrainV8ShadowOutcomeRow | undefined,
  quality: BrainV8ComparisonQuality,
): { nudge: number; tag: BrainV8InfluenceTag } {
  if (!shadow || quality.weakComparison) return { nudge: 0, tag: "none" };
  if (shadow.shadowLabel === "insufficient_evidence" || shadow.insufficientEvidence) {
    return { nudge: -0.04, tag: "monitor" };
  }
  if (isCriticalOutcome(o)) {
    if (shadow.shadowLabel === "review") return { nudge: -0.03, tag: "caution" };
    return { nudge: 0, tag: "none" };
  }
  const delta = Math.abs(shadow.shadowSignal - shadow.storedOutcomeScore);
  if (shadow.shadowLabel === "aligned" && delta < 0.14 && quality.meanAbsDelta < 0.14) {
    return { nudge: Math.min(MAX_PRESENTATION_NUDGE, 0.06), tag: "boost" };
  }
  if (shadow.shadowLabel === "review" && delta > 0.14) {
    return { nudge: -Math.min(MAX_PRESENTATION_NUDGE, 0.07), tag: "caution" };
  }
  return { nudge: 0, tag: "none" };
}

function rebuildTimelineFromOutcomes(
  outcomes: BrainDecisionOutcomeDTO[],
  lastLearningRun: BrainSnapshotPayload["lastLearningRun"],
): BrainTimelineEntry[] {
  const timeline: BrainTimelineEntry[] = [];
  for (const o of outcomes.slice(0, 15)) {
    timeline.push({
      at: o.createdAt.toISOString(),
      kind: "outcome",
      title: `Outcome · ${o.source} · ${o.outcomeType}`,
      detail: `${o.reason} (score ${o.outcomeScore.toFixed(3)})`,
    });
  }
  if (lastLearningRun) {
    timeline.push({
      at: lastLearningRun.createdAt.toISOString(),
      kind: "learning_run",
      title: `Learning run · ${lastLearningRun.decisionCount} outcomes considered`,
      detail: `Sources touched: ${lastLearningRun.sourceCount}`,
    });
  }
  timeline.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return timeline;
}

export type BrainSnapshotWithV8Influence = BrainSnapshotPayload & { brainV8Influence?: BrainV8InfluenceLayer };

export type ApplyBrainV8InfluenceOpts = {
  /**
   * When true with `FEATURE_BRAIN_V8_PRIMARY_V1`, applies the influence layer even if Phase C influence flag is off.
   * Used only from Brain V8 Phase D primary router — avoids double-applying Phase C overlay.
   */
  primaryPath?: boolean;
};

/**
 * Applies bounded presentation-only influence. Passes through unchanged when influence flag is off or quality is weak (annotation-only path).
 */
export function applyBrainV8Influence(
  snapshot: BrainSnapshotPayload,
  shadowResult: BrainV8ShadowObservationResult,
  quality: BrainV8ComparisonQuality,
  opts?: ApplyBrainV8InfluenceOpts,
): BrainSnapshotWithV8Influence {
  const allowInfluence =
    oneBrainV8Flags.brainV8InfluenceV1 ||
    (opts?.primaryPath === true && oneBrainV8Flags.brainV8PrimaryV1);
  if (!allowInfluence) {
    return { ...snapshot };
  }

  const warnings: string[] = [];
  const tagsByDecisionId: Record<string, BrainV8InfluenceTag> = {};
  let boosted = 0;
  let caution = 0;
  let monitor = 0;
  let skipped = 0;
  let influenced = 0;

  const shadowByDecision = new Map(shadowResult.rows.map((r) => [r.decisionId, r]));
  const out = structuredClone(snapshot) as BrainSnapshotPayload;

  if (quality.weakComparison) {
    warnings.push("comparison_quality_weak");
    logWarn(NS, "influence_skipped_weak_comparison", quality);
    const layer: BrainV8InfluenceLayer = {
      enabled: true,
      applied: false,
      skippedReason: "weak_comparison",
      tagsByDecisionId: {},
      stats: { boosted: 0, caution: 0, monitor: 0, skipped: shadowResult.sampleSize, influenced: 0 },
      warnings,
    };
    out.notes = [...out.notes, "Brain V8 influence: skipped (comparison quality below threshold) — authoritative data unchanged."];
    return { ...out, brainV8Influence: layer };
  }

  type Row = { o: BrainDecisionOutcomeDTO; nudge: number; tag: BrainV8InfluenceTag };
  const rows: Row[] = [];
  for (const o of out.recentOutcomes) {
    const sh = shadowByDecision.get(o.decisionId);
    const { nudge, tag } = nudgeForRow(o, sh, quality);
    tagsByDecisionId[o.decisionId] = tag;
    if (tag === "boost") boosted++;
    else if (tag === "caution") caution++;
    else if (tag === "monitor") monitor++;
    else if (tag === "none" && nudge === 0) skipped++;
    rows.push({ o, nudge, tag });
  }

  const maxInf = Math.max(1, Math.floor(rows.length * MAX_INFLUENCED_FRACTION));
  const priority = rows
    .map((r, i) => ({ ...r, i, absNudge: Math.abs(r.nudge) }))
    .filter((r) => r.nudge !== 0)
    .sort((a, b) => b.absNudge - a.absNudge)
    .slice(0, maxInf);
  const allow = new Set(priority.map((p) => p.i));

  const scored = rows.map((r, i) => ({
    ...r,
    sortKey: r.o.outcomeScore + (allow.has(i) ? r.nudge : 0),
  }));
  scored.sort((a, b) => b.sortKey - a.sortKey || a.o.decisionId.localeCompare(b.o.decisionId));

  out.recentOutcomes = scored.map((s) => s.o);
  influenced = priority.length;
  out.timeline = rebuildTimelineFromOutcomes(out.recentOutcomes, out.lastLearningRun);
  out.notes = [
    ...out.notes,
    `Brain V8 presentation influence: reordering is display-only (${influenced} rows nudged, capped).`,
  ];

  if (quality.meanAbsDelta > 0.18 && boosted > 0) {
    warnings.push("elevated_mean_delta_with_boost");
  }
  if (influenced > Math.floor(scored.length * 0.45)) {
    warnings.push("high_fraction_influenced");
  }

  const layer: BrainV8InfluenceLayer = {
    enabled: true,
    applied: true,
    tagsByDecisionId,
    stats: { boosted, caution, monitor, skipped, influenced },
    warnings,
  };

  logInfo(NS, {
    influenced,
    boosted,
    caution,
    monitor,
    skipped,
    sampleSize: quality.sampleSize,
    weakComparison: quality.weakComparison,
    warnings: warnings.length ? warnings : undefined,
  });

  return { ...out, brainV8Influence: layer };
}

/**
 * Single entry: derive shadow from snapshot, evaluate quality, apply influence when gated.
 */
export function applyBrainV8PresentationOverlay(snapshot: BrainSnapshotPayload): BrainSnapshotWithV8Influence {
  if (!oneBrainV8Flags.brainV8InfluenceV1) {
    return { ...snapshot };
  }
  const shadow = buildShadowObservationFromSnapshot(snapshot);
  const quality = buildBrainV8ComparisonQuality(shadow);
  return applyBrainV8Influence(snapshot, shadow, quality);
}
