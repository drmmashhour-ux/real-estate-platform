/**
 * Global Fusion Phase B — bounded presentation/prioritization overlay only.
 * Does not mutate caller inputs; returns deep-cloned structures with optional tags and ordering.
 */
import { logWarn } from "@/lib/logger";
import { globalFusionFlags } from "@/config/feature-flags";
import { isFusionInfluenceFrozen } from "./global-fusion-freeze.service";
import type {
  GlobalFusionConflict,
  GlobalFusionInfluenceAdjustment,
  GlobalFusionInfluenceGateSummary,
  GlobalFusionInfluenceMetrics,
  GlobalFusionInfluenceReason,
  GlobalFusionInfluenceResult,
  GlobalFusionNormalizedSignal,
  GlobalFusionOpportunity,
  GlobalFusionRecommendation,
  GlobalFusionRisk,
  GlobalFusionScore,
} from "./global-fusion.types";

const NS = "[global:fusion:influence]";

const MAX_DELTA = 0.15;
const MAX_INFLUENCED_FRACTION = 0.45;

function clampDelta(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.max(-MAX_DELTA, Math.min(MAX_DELTA, x));
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export type ApplyGlobalFusionInfluenceInput = {
  opportunities: GlobalFusionOpportunity[];
  risks: GlobalFusionRisk[];
  recommendations: GlobalFusionRecommendation[];
  signals: GlobalFusionNormalizedSignal[];
  scores: GlobalFusionScore;
  conflicts: GlobalFusionConflict[];
  mergedMissingSources: string[];
  malformedWarnings: string[];
  contributingSystemsCount: number;
};

export type ApplyGlobalFusionInfluenceOutput = {
  opportunities: GlobalFusionOpportunity[];
  risks: GlobalFusionRisk[];
  recommendations: GlobalFusionRecommendation[];
  result: GlobalFusionInfluenceResult;
};

function emptyMetrics(): GlobalFusionInfluenceMetrics {
  return {
    influencedCount: 0,
    boostedCount: 0,
    cautionCount: 0,
    deferredCount: 0,
    monitorCount: 0,
    humanReviewCount: 0,
  };
}

function runGate(input: ApplyGlobalFusionInfluenceInput): GlobalFusionInfluenceGateSummary {
  const missingOk = input.mergedMissingSources.length <= 3;
  const malformedOk = input.malformedWarnings.length === 0;
  const evidenceOk = input.scores.evidenceScore >= 0.28;
  const disagreementOk =
    input.conflicts.length <= 4 || input.scores.agreementScore >= 0.38;

  const reasons: string[] = [];
  if (!missingOk) reasons.push("missing_sources_above_threshold");
  if (!malformedOk) reasons.push("malformed_normalized_signals");
  if (!evidenceOk) reasons.push("evidence_score_low");
  if (!disagreementOk) reasons.push("disagreement_or_conflicts_elevated");

  let tier: GlobalFusionInfluenceGateSummary["tier"] = "strong";
  if (input.malformedWarnings.length > 0 || input.signals.length === 0) {
    tier = "blocked";
  } else if (!missingOk || !evidenceOk || input.mergedMissingSources.length > 2) {
    tier = "weak";
  }

  const passed = tier !== "blocked";
  const applyOrdering = tier === "strong" && missingOk && malformedOk && evidenceOk && disagreementOk;

  return {
    passed,
    applyOrdering,
    tier,
    reasons: tier === "strong" ? ["quality_acceptable"] : reasons,
    missingSourcesOk: missingOk,
    malformedRateOk: malformedOk,
    evidenceOk,
    disagreementOk,
  };
}

function buildObservationalWarnings(
  input: ApplyGlobalFusionInfluenceInput,
  gate: GlobalFusionInfluenceGateSummary,
  metrics: GlobalFusionInfluenceMetrics,
): string[] {
  const w: string[] = [];
  if (input.mergedMissingSources.length > 2 && metrics.boostedCount > 0) {
    w.push("influence_boost_with_weak_source_coverage");
  }
  const totalItems =
    input.opportunities.length + input.risks.length + input.recommendations.length;
  if (totalItems >= 6 && metrics.influencedCount / totalItems > MAX_INFLUENCED_FRACTION) {
    w.push("high_fraction_of_items_influenced");
  }
  if (input.conflicts.some((c) => c.severity === "high") && metrics.boostedCount > 0) {
    w.push("boost_applied_despite_high_severity_conflict");
  }
  if (input.malformedWarnings.length > 0) {
    w.push("malformed_signals_present");
  }
  if (gate.tier === "weak" && metrics.boostedCount > 2) {
    w.push("unstable_influence_pattern_weak_tier");
  }
  if (input.scores.agreementScore < 0.35 && metrics.cautionCount < 1 && gate.tier === "strong") {
    w.push("large_disagreement_little_caution_tagging");
  }
  return w;
}

/**
 * Applies bounded presentation influence when `FEATURE_GLOBAL_FUSION_INFLUENCE_V1` is on.
 * Callers must pass copies if they need to retain originals; this function clones internally.
 */
export function applyGlobalFusionInfluence(input: ApplyGlobalFusionInfluenceInput): ApplyGlobalFusionInfluenceOutput {
  const reasons: GlobalFusionInfluenceReason[] = [];
  const adjustments: GlobalFusionInfluenceAdjustment[] = [];
  const metrics = emptyMetrics();

  if (!globalFusionFlags.globalFusionInfluenceV1) {
    const gate: GlobalFusionInfluenceGateSummary = {
      passed: false,
      applyOrdering: false,
      tier: "blocked",
      reasons: ["global_fusion_influence_flag_off"],
      missingSourcesOk: true,
      malformedRateOk: true,
      evidenceOk: true,
      disagreementOk: true,
    };
    const result: GlobalFusionInfluenceResult = {
      applied: false,
      skipped: true,
      gate,
      reasons: [{ code: "flag_off", detail: "FEATURE_GLOBAL_FUSION_INFLUENCE_V1 disabled" }],
      adjustments: [],
      metrics,
      observationalWarnings: [],
      influencedItems: [],
    };
    return {
      opportunities: clone(input.opportunities),
      risks: clone(input.risks),
      recommendations: clone(input.recommendations),
      result,
    };
  }

  if (isFusionInfluenceFrozen()) {
    const gate: GlobalFusionInfluenceGateSummary = {
      passed: false,
      applyOrdering: false,
      tier: "blocked",
      reasons: ["fusion_local_influence_frozen"],
      missingSourcesOk: true,
      malformedRateOk: true,
      evidenceOk: true,
      disagreementOk: true,
    };
    const result: GlobalFusionInfluenceResult = {
      applied: false,
      skipped: true,
      gate,
      reasons: [{ code: "governance_freeze", detail: "Fusion-local influence frozen (Phase F governance)." }],
      adjustments: [],
      metrics,
      observationalWarnings: [],
      influencedItems: [],
    };
    return {
      opportunities: clone(input.opportunities),
      risks: clone(input.risks),
      recommendations: clone(input.recommendations),
      result,
    };
  }

  const gate = runGate(input);
  let opps = clone(input.opportunities);
  let risks = clone(input.risks);
  let recs = clone(input.recommendations);

  if (!gate.passed) {
    reasons.push({ code: "gate_blocked", detail: "Malformed or empty signals — influence skipped." });
    const result: GlobalFusionInfluenceResult = {
      applied: false,
      skipped: true,
      gate,
      reasons,
      adjustments: [],
      metrics,
      observationalWarnings: buildObservationalWarnings(input, gate, metrics),
      influencedItems: [],
    };
    return { opportunities: opps, risks, recommendations: recs, result };
  }

  const highHumanReview = input.conflicts.some((c) => c.recommendation === "require_human_review");
  const highSev = input.conflicts.filter((c) => c.severity === "high").length;
  const fusedRisk = input.scores.fusedRisk;
  const fusedConf = input.scores.fusedConfidence;
  const agr = input.scores.agreementScore;

  /** Weak tier or quality gate denied ordering: tags only, preserve relative priority from confidence. */
  if (gate.tier === "weak" || !gate.applyOrdering) {
    const reasonDetail =
      gate.tier === "weak"
        ? "Ordering preserved; monitor/low-evidence tags applied."
        : "Strong tier but ordering gated off — annotation-only overlay.";
    const reasonCode = gate.tier === "weak" ? "weak_tier" : "annotation_only_no_ordering";

    let idx = 0;
    for (const o of opps) {
      const tags: string[] = [...(o.influenceTags ?? [])];
      tags.push("low_evidence", "monitor_only");
      if (highHumanReview) tags.push("require_human_review");
      o.influenceTags = [...new Set(tags)];
      o.displayOrder = idx++;
      o.displayPriority = o.confidence;
      adjustments.push({
        targetKind: "opportunity",
        targetId: o.id,
        deltaPriority: 0,
        tagsAdded: o.influenceTags ?? [],
        reason: "weak_tier_annotation_only",
      });
      metrics.influencedCount++;
      metrics.monitorCount++;
    }
    let rki = 0;
    for (const r of risks) {
      const tags = [...(r.influenceTags ?? []), "monitor_only", "low_evidence"];
      if (fusedRisk > 0.55) tags.push("caution");
      r.influenceTags = [...new Set(tags)];
      r.displayOrder = rki++;
      r.displayPriority = r.severity === "high" ? 0.85 : 0.5;
      adjustments.push({
        targetKind: "risk",
        targetId: r.id,
        deltaPriority: 0,
        tagsAdded: r.influenceTags ?? [],
        reason: "weak_tier_annotation_only",
      });
      metrics.influencedCount++;
      metrics.monitorCount++;
      if (r.influenceTags?.includes("caution")) metrics.cautionCount++;
    }
    let ri = 0;
    for (const r of recs) {
      const rid = r.id ?? `gf:rec:${ri}`;
      const tags = [...(r.influenceTags ?? [])];
      if (r.kind === "require_human_review") {
        tags.push("require_human_review");
        metrics.humanReviewCount++;
      } else {
        tags.push("low_evidence", "monitor_only");
        metrics.monitorCount++;
      }
      r.id = rid;
      r.influenceTags = [...new Set(tags)];
      r.displayOrder = ri++;
      r.displayPriority = 0.5;
      adjustments.push({
        targetKind: "recommendation",
        targetId: rid,
        deltaPriority: 0,
        tagsAdded: r.influenceTags ?? [],
        reason: "weak_tier_annotation_only",
      });
      metrics.influencedCount++;
    }

    const observationalWarnings = buildObservationalWarnings(input, gate, metrics);
    for (const w of observationalWarnings) {
      logWarn(NS, { event: "safety_warning", warning: w });
    }

    const influencedItems = adjustments.map((a) => ({
      kind: a.targetKind,
      id: a.targetId,
    }));

    const result: GlobalFusionInfluenceResult = {
      applied: true,
      skipped: false,
      gate,
      reasons: [{ code: reasonCode, detail: reasonDetail }],
      adjustments,
      metrics,
      observationalWarnings,
      influencedItems,
    };
    return { opportunities: opps, risks, recommendations: recs, result };
  }

  /** Strong tier: bounded priority deltas + reorder opportunities. */
  let order = 0;
  for (const o of opps) {
    let base = o.confidence;
    let delta = 0;
    if (agr > 0.62 && fusedRisk < 0.48 && highSev === 0) {
      delta += clampDelta(0.12 * (1 - fusedRisk));
      metrics.boostedCount++;
    }
    if (fusedRisk > 0.58 || highSev > 0) {
      delta -= clampDelta(0.1 + 0.05 * highSev);
      metrics.cautionCount++;
    }
    if (input.mergedMissingSources.length > 1) {
      delta -= clampDelta(0.06);
    }
    delta = clampDelta(delta);
    const tags: string[] = [...(o.influenceTags ?? [])];
    if (delta > 0.02) tags.push("boost");
    if (delta < -0.02) tags.push("caution");
    if (fusedConf < 0.4 && agr < 0.5) {
      tags.push("defer");
      metrics.deferredCount++;
    }
    if (highHumanReview) {
      tags.push("require_human_review");
      metrics.humanReviewCount++;
    }
    o.displayPriority = Math.min(1, Math.max(0, base + delta));
    o.influenceTags = [...new Set(tags)];
    o.displayOrder = order++;
    adjustments.push({
      targetKind: "opportunity",
      targetId: o.id,
      deltaPriority: delta,
      tagsAdded: tags,
      reason: "strong_tier_priority_adjust",
    });
    metrics.influencedCount++;
  }

  opps.sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0));
  opps.forEach((o, i) => {
    o.displayOrder = i;
  });

  let ridx = 0;
  for (const r of risks) {
    const tags = [...(r.influenceTags ?? [])];
    if (r.severity === "high" || fusedRisk > 0.55) tags.push("caution");
    if (gate.tier === "strong" && input.scores.evidenceScore < 0.4) tags.push("monitor_only");
    r.influenceTags = [...new Set(tags)];
    r.displayPriority = r.severity === "high" ? 0.9 : 0.55;
    r.displayOrder = ridx++;
    adjustments.push({
      targetKind: "risk",
      targetId: r.id,
      deltaPriority: 0,
      tagsAdded: r.influenceTags ?? [],
      reason: "strong_tier_risk_tags",
    });
    metrics.influencedCount++;
    if (tags.includes("caution")) metrics.cautionCount++;
    if (tags.includes("monitor_only")) metrics.monitorCount++;
  }

  risks.sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0));
  risks.forEach((r, i) => {
    r.displayOrder = i;
  });

  let cidx = 0;
  for (const r of recs) {
    const rid = r.id ?? `gf:rec:${cidx}`;
    r.id = rid;
    const tags = [...(r.influenceTags ?? [])];
    if (r.kind === "require_human_review") {
      tags.push("require_human_review");
      metrics.humanReviewCount++;
    } else if (fusedRisk > 0.55) {
      tags.push("proceed_with_caution");
      metrics.cautionCount++;
    }
    r.influenceTags = [...new Set(tags)];
    r.displayPriority = r.kind === "require_human_review" ? 1 : 0.5;
    r.displayOrder = cidx++;
    adjustments.push({
      targetKind: "recommendation",
      targetId: rid,
      deltaPriority: 0,
      tagsAdded: r.influenceTags ?? [],
      reason: "strong_tier_rec_tags",
    });
    metrics.influencedCount++;
  }

  recs.sort((a, b) => (b.displayPriority ?? 0) - (a.displayPriority ?? 0));
  recs.forEach((r, i) => {
    r.displayOrder = i;
  });

  const observationalWarnings = buildObservationalWarnings(input, gate, metrics);
  for (const w of observationalWarnings) {
    logWarn(NS, { event: "safety_warning", warning: w });
  }

  const influencedItems = adjustments.map((a) => ({
    kind: a.targetKind,
    id: a.targetId,
  }));

  const result: GlobalFusionInfluenceResult = {
    applied: true,
    skipped: false,
    gate,
    reasons: [{ code: "strong_tier", detail: "Bounded priority and tags applied." }],
    adjustments,
    metrics,
    observationalWarnings,
    influencedItems,
  };

  return { opportunities: opps, risks, recommendations: recs, result };
}
