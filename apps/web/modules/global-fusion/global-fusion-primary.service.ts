/**
 * Global Fusion Phase C — primary cross-system advisory surface (composition only).
 * Calls `buildGlobalFusionPayload` exactly once; Phase B influence runs inside that path only (no double overlay).
 */
import { logInfo, logWarn } from "@/lib/logger";
import { globalFusionFlags } from "@/config/feature-flags";
import type { LoadAiControlCenterParams } from "@/modules/control-center/ai-control-center.types";
import { buildGlobalFusionPayload } from "./global-fusion.service";
import { recordGlobalFusionRun } from "./global-fusion-monitoring.service";
import { tryEvaluateGovernance } from "./global-fusion-governance.service";
import type {
  GlobalFusionOpportunity,
  GlobalFusionPrimaryBucket,
  GlobalFusionPrimaryFallbackReason,
  GlobalFusionPrimaryGroupedBuckets,
  GlobalFusionPrimaryPathLabel,
  GlobalFusionPrimarySurface,
  GlobalFusionPrimarySurfaceItem,
  GlobalFusionPrimarySurfaceMeta,
  GlobalFusionPrimarySurfaceResult,
  GlobalFusionPrimaryValidationResult,
  GlobalFusionPayload,
  GlobalFusionRecommendation,
  GlobalFusionRisk,
  GlobalFusionSnapshot,
} from "./global-fusion.types";

const NS = "[global:fusion:primary]";

function emptyGrouped(): GlobalFusionPrimaryGroupedBuckets {
  return {
    proceed: [],
    proceed_with_caution: [],
    monitor_only: [],
    defer: [],
    blocked: [],
    require_human_review: [],
    insufficient_evidence: [],
  };
}

function cloneRanked<T extends { displayPriority?: number; displayOrder?: number }>(items: T[]): T[] {
  const copy = items.map((x) => ({ ...x }));
  return copy.sort((a, b) => {
    const dp = (b.displayPriority ?? 0) - (a.displayPriority ?? 0);
    if (dp !== 0) return dp;
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });
}

function opportunityBucket(o: GlobalFusionOpportunity): GlobalFusionPrimaryBucket {
  const t = new Set(o.influenceTags ?? []);
  if (t.has("require_human_review")) return "require_human_review";
  if (t.has("defer")) return "defer";
  if (t.has("blocked")) return "blocked";
  if (t.has("low_evidence") || (t.has("monitor_only") && o.confidence < 0.55)) return "insufficient_evidence";
  if (t.has("monitor_only")) return "monitor_only";
  if (t.has("caution") || t.has("proceed_with_caution")) return "proceed_with_caution";
  if (t.has("boost") && o.confidence >= 0.62) return "proceed";
  if (o.confidence >= 0.68) return "proceed";
  return "proceed_with_caution";
}

function riskBucket(r: GlobalFusionRisk): GlobalFusionPrimaryBucket {
  const t = new Set(r.influenceTags ?? []);
  if (t.has("require_human_review")) return "require_human_review";
  if (r.severity === "high") return "blocked";
  if (t.has("caution")) return "proceed_with_caution";
  if (t.has("monitor_only")) return "monitor_only";
  return "proceed_with_caution";
}

function recommendationBucket(rec: GlobalFusionRecommendation): GlobalFusionPrimaryBucket {
  switch (rec.kind) {
    case "require_human_review":
      return "require_human_review";
    case "defer_until_evidence":
      return "defer";
    case "monitor_only":
      return "monitor_only";
    case "prioritize_growth":
      return "proceed";
    case "prioritize_stability":
    case "fix_funnel_first":
    case "expand_ranking_cautiously":
      return "proceed_with_caution";
    default:
      return "proceed_with_caution";
  }
}

function itemFromOpportunity(o: GlobalFusionOpportunity): GlobalFusionPrimarySurfaceItem {
  return {
    kind: "opportunity",
    id: o.id,
    systems: o.systems,
    title: o.title,
    summary: o.rationale,
    rationale: o.rationale,
    confidenceSummary: `~${(o.confidence * 100).toFixed(0)}%`,
    tags: [...(o.influenceTags ?? [])],
    provenanceSystems: o.systems,
  };
}

function itemFromRisk(r: GlobalFusionRisk): GlobalFusionPrimarySurfaceItem {
  return {
    kind: "risk",
    id: r.id,
    systems: r.systems,
    title: r.title,
    summary: r.rationale,
    rationale: r.rationale,
    riskSummary: r.severity,
    tags: [...(r.influenceTags ?? []), `severity:${r.severity}`],
    provenanceSystems: r.systems,
  };
}

function itemFromRecommendation(rec: GlobalFusionRecommendation): GlobalFusionPrimarySurfaceItem {
  return {
    kind: "recommendation",
    id: rec.id ?? rec.title,
    systems: [...rec.systemsAgreed, ...rec.systemsDisagreed],
    title: rec.title,
    summary: rec.why,
    rationale: rec.why,
    confidenceSummary: rec.confidenceSummary,
    riskSummary: rec.riskSummary,
    evidenceSummary: rec.evidenceSummary,
    tags: [...(rec.influenceTags ?? []), `kind:${rec.kind}`],
    provenanceSystems: [...new Set([...rec.systemsAgreed, ...rec.systemsDisagreed])],
  };
}

function mapValidationReasonToFallback(reason: string): GlobalFusionPrimaryFallbackReason {
  const m: Record<string, GlobalFusionPrimaryFallbackReason> = {
    fusion_disabled_or_empty_snapshot: "fusion_disabled",
    malformed_normalized_signals: "malformed_signals",
    no_signals: "insufficient_coverage",
    scores_non_finite: "scores_invalid",
    subsystem_coverage_weak: "insufficient_coverage",
    missing_sources_excess: "missing_sources_excess",
    unexpected_empty_advisory: "unexpected_empty_advisory",
    influence_contradictory_output: "influence_contradictory_output",
  };
  return m[reason] ?? "assembly_error";
}

function validatePrimaryFusionOutput(payload: GlobalFusionPayload): GlobalFusionPrimaryValidationResult {
  const reasons: string[] = [];
  if (!payload.enabled || !payload.snapshot) {
    return { ok: false, reasons: ["fusion_disabled_or_empty_snapshot"] };
  }

  const snap = payload.snapshot;
  const meta = payload.meta;

  if (meta.malformedNormalizedCount > 0) {
    reasons.push("malformed_normalized_signals");
  }
  if (snap.signals.length === 0) {
    reasons.push("no_signals");
  }

  const sc = snap.scores;
  if (
    ![sc.fusedConfidence, sc.fusedPriority, sc.fusedRisk, sc.actionability, sc.agreementScore, sc.evidenceScore].every(
      Number.isFinite,
    )
  ) {
    reasons.push("scores_non_finite");
  }

  if (meta.contributingSystemsCount < 2) {
    reasons.push("subsystem_coverage_weak");
  }

  if (meta.missingSources.length > 5) {
    reasons.push("missing_sources_excess");
  }

  const meaningfulSignals = snap.signals.length >= 2;
  const emptyAdvisory =
    snap.opportunities.length === 0 && snap.recommendations.length === 0 && snap.risks.length === 0;
  if (meaningfulSignals && emptyAdvisory) {
    reasons.push("unexpected_empty_advisory");
  }

  return reasons.length ? { ok: false, reasons } : { ok: true, reasons: [] };
}

function buildSurfaceFromSnapshot(
  snap: GlobalFusionSnapshot,
  path: GlobalFusionPrimaryPathLabel,
  fallbackUsed: boolean,
  fallbackReason: GlobalFusionPrimaryFallbackReason | undefined,
  payloadMeta: { sourcesUsed: string[]; missingSources: string[] },
): GlobalFusionPrimarySurface {
  const opportunitiesRanked = cloneRanked(snap.opportunities);
  const risksRanked = cloneRanked(snap.risks);
  const recommendationsRanked = cloneRanked(snap.recommendations);

  const groupedBy = emptyGrouped();

  for (const o of opportunitiesRanked) {
    groupedBy[opportunityBucket(o)].push(itemFromOpportunity(o));
  }
  for (const r of risksRanked) {
    groupedBy[riskBucket(r)].push(itemFromRisk(r));
  }
  for (const rec of recommendationsRanked) {
    groupedBy[recommendationBucket(rec)].push(itemFromRecommendation(rec));
  }

  const meta: GlobalFusionPrimarySurfaceMeta = {
    systemsUsed: payloadMeta.sourcesUsed,
    agreementScore: snap.scores.agreementScore,
    conflictCount: snap.conflicts.length,
    evidenceQuality: snap.scores.evidenceScore,
    missingSources: payloadMeta.missingSources,
    fallbackUsed,
    fallbackReason,
    path,
  };

  return {
    generatedAt: snap.generatedAt,
    opportunitiesRanked,
    risksRanked,
    recommendationsRanked,
    groupedBy,
    meta,
  };
}

function collectPrimaryObservationalWarnings(
  payload: GlobalFusionPayload,
  path: GlobalFusionPrimaryPathLabel,
  validation: GlobalFusionPrimaryValidationResult,
): string[] {
  const w: string[] = [];
  if (!payload.snapshot) return w;

  const m = payload.meta;
  const s = payload.snapshot;

  if (globalFusionFlags.globalFusionPrimaryV1 && path === "global_fusion_primary_fallback_default") {
    w.push("primary_enabled_but_fallback_path");
  }

  if (m.missingSources.length > 2) {
    w.push("weak_source_coverage");
  }

  if (s.signals.length >= 2 && s.opportunities.length + s.recommendations.length + s.risks.length === 0) {
    w.push("advisory_empty_despite_signals");
  }

  const disagreementRate = m.conflictCount / Math.max(1, m.normalizedSignalCount);
  if (disagreementRate > 0.55 && m.normalizedSignalCount > 4) {
    w.push("unusually_high_disagreement_rate");
  }

  if (m.malformedNormalizedCount > 0) {
    w.push("malformed_normalized_signals_present");
  }

  for (const o of s.opportunities) {
    if (o.systems.length === 0) w.push("provenance_missing_opportunity");
  }
  for (const r of s.risks) {
    if (r.systems.length === 0) w.push("provenance_missing_risk");
  }
  for (const rec of s.recommendations) {
    if (rec.systemsAgreed.length === 0 && rec.systemsDisagreed.length === 0) {
      w.push("provenance_missing_recommendation");
    }
  }

  return [...new Set(w)];
}

function withPrimaryMonitoring(result: GlobalFusionPrimarySurfaceResult): GlobalFusionPrimarySurfaceResult {
  try {
    recordGlobalFusionRun(result);
  } catch {
    /* Phase D monitoring must never block or throw */
  }
  tryEvaluateGovernance();
  return result;
}

/**
 * Builds the optional Phase C primary advisory surface. Always returns the underlying `fusionPayload` from a single
 * `buildGlobalFusionPayload` call (Phase B influence at most once). Safe to call when PRIMARY_V1 is off.
 */
export async function buildGlobalFusionPrimarySurface(
  params: LoadAiControlCenterParams = {},
): Promise<GlobalFusionPrimarySurfaceResult> {
  let fusionPayload: GlobalFusionPayload;

  try {
    fusionPayload = await buildGlobalFusionPayload(params);
  } catch (err) {
    logWarn(NS, { event: "assembly_error", detail: String(err) });
    fusionPayload = {
      enabled: false,
      snapshot: null,
      health: {
        overallStatus: "limited",
        observationalWarnings: ["Global Fusion assembly failed — primary surface unavailable."],
        insufficientEvidenceCount: 0,
        missingSourceCount: 0,
      },
      meta: {
        dataFreshnessMs: 0,
        sourcesUsed: [],
        missingSources: [],
        contributingSystemsCount: 0,
        normalizedSignalCount: 0,
        conflictCount: 0,
        recommendationCount: 0,
        persistenceLogged: false,
        influenceFlag: globalFusionFlags.globalFusionInfluenceV1,
        primaryFlag: globalFusionFlags.globalFusionPrimaryV1,
        influenceApplied: false,
        malformedNormalizedCount: 0,
      },
    };
    return withPrimaryMonitoring({
      path: "global_fusion_primary_fallback_default",
      primarySurfaceActive: false,
      surface: null,
      fusionPayload,
      validation: { ok: false, reasons: ["assembly_error"] },
      observationalWarnings: ["assembly_error"],
    });
  }

  if (!globalFusionFlags.globalFusionPrimaryV1) {
    logInfo(NS, {
      primaryEnabled: false,
      path: "source_advisory_default",
      systems: fusionPayload.meta.contributingSystemsCount,
    });
    return withPrimaryMonitoring({
      path: "source_advisory_default",
      primarySurfaceActive: false,
      surface: null,
      fusionPayload,
      validation: { ok: true, reasons: ["primary_flag_off"] },
      observationalWarnings: [],
    });
  }

  if (!globalFusionFlags.globalFusionV1 || !fusionPayload.enabled || !fusionPayload.snapshot) {
    const validation: GlobalFusionPrimaryValidationResult = {
      ok: false,
      reasons: ["fusion_disabled_or_empty_snapshot"],
    };
    logInfo(NS, {
      primaryEnabled: true,
      path: "global_fusion_primary_fallback_default",
      fallback: true,
      validation: validation.reasons,
    });
    return withPrimaryMonitoring({
      path: "global_fusion_primary_fallback_default",
      primarySurfaceActive: false,
      surface: null,
      fusionPayload,
      validation,
      observationalWarnings: collectPrimaryObservationalWarnings(
        fusionPayload,
        "global_fusion_primary_fallback_default",
        validation,
      ),
    });
  }

  const validation = validatePrimaryFusionOutput(fusionPayload);

  if (!validation.ok) {
    const primaryReason = validation.reasons[0] ?? "assembly_error";
    const fallbackReason = mapValidationReasonToFallback(primaryReason);
    logWarn(NS, {
      event: "primary_fallback",
      path: "global_fusion_primary_fallback_default",
      reasons: validation.reasons,
      fallbackReason,
    });
    return withPrimaryMonitoring({
      path: "global_fusion_primary_fallback_default",
      primarySurfaceActive: false,
      surface: null,
      fusionPayload,
      validation,
      observationalWarnings: collectPrimaryObservationalWarnings(
        fusionPayload,
        "global_fusion_primary_fallback_default",
        validation,
      ),
    });
  }

  const surface = buildSurfaceFromSnapshot(fusionPayload.snapshot, "global_fusion_primary", false, undefined, {
    sourcesUsed: fusionPayload.meta.sourcesUsed,
    missingSources: fusionPayload.meta.missingSources,
  });

  const observationalWarnings = collectPrimaryObservationalWarnings(fusionPayload, "global_fusion_primary", validation);
  for (const ow of observationalWarnings) {
    logWarn(NS, { event: "safety_observation", warning: ow });
  }

  logInfo(NS, {
    primaryEnabled: true,
    path: "global_fusion_primary",
    systemsUsed: fusionPayload.meta.contributingSystemsCount,
    missingSources: fusionPayload.meta.missingSources.length,
    opportunities: surface.opportunitiesRanked.length,
    recommendations: surface.recommendationsRanked.length,
    groupedCounts: {
      proceed: surface.groupedBy.proceed.length,
      proceed_with_caution: surface.groupedBy.proceed_with_caution.length,
      monitor_only: surface.groupedBy.monitor_only.length,
      defer: surface.groupedBy.defer.length,
      blocked: surface.groupedBy.blocked.length,
      require_human_review: surface.groupedBy.require_human_review.length,
      insufficient_evidence: surface.groupedBy.insufficient_evidence.length,
    },
    fallbackUsed: false,
    agreementScore: fusionPayload.snapshot.scores.agreementScore,
    conflictCount: fusionPayload.meta.conflictCount,
  });

  return withPrimaryMonitoring({
    path: "global_fusion_primary",
    primarySurfaceActive: true,
    surface,
    fusionPayload,
    validation,
    observationalWarnings,
  });
}
