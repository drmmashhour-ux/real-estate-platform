/**
 * Global Fusion V1 — aggregates Brain/Ads/CRO/Ranking via read-only AI Control Center payload.
 * Phase C (`buildGlobalFusionPrimarySurface`) consumes this payload once; Phase B influence runs here only, not twice.
 */
import { globalFusionFlags } from "@/config/feature-flags";
import { loadAiControlCenterPayload } from "@/modules/control-center/ai-control-center.service";
import type { LoadAiControlCenterParams } from "@/modules/control-center/ai-control-center.types";
import { detectGlobalFusionConflicts } from "./global-fusion-conflict.service";
import { normalizeControlCenterSystems } from "./global-fusion-normalizer.service";
import { buildGlobalFusionRecommendations } from "./global-fusion-recommendation.service";
import { computeGlobalFusionScores } from "./global-fusion-scoring.service";
import { logGlobalFusionPayload } from "./global-fusion-monitoring.service";
import { maybeLogGlobalFusionPersistenceStub } from "./global-fusion-persistence.service";
import { applyGlobalFusionInfluence } from "./global-fusion-influence.service";
import type {
  GlobalFusionConflict,
  GlobalFusionHealthSummary,
  GlobalFusionNormalizedSignal,
  GlobalFusionOpportunity,
  GlobalFusionPayload,
  GlobalFusionRisk,
  GlobalFusionSnapshot,
  GlobalFusionSource,
} from "./global-fusion.types";

function buildOpportunities(signals: GlobalFusionNormalizedSignal[]): GlobalFusionOpportunity[] {
  return signals
    .filter((s) => (s.confidence ?? 0) >= 0.52 && (s.risk ?? 1) <= 0.55)
    .slice(0, 5)
    .map((s, i) => ({
      id: `gf:opp:${i}:${s.source}`,
      title: `${String(s.source).toUpperCase()} · ${s.recommendationType ?? "signal"}`,
      systems: [s.source] as GlobalFusionSource[],
      confidence: s.confidence ?? 0,
      rationale: s.provenance,
    }));
}

function buildRisks(signals: GlobalFusionNormalizedSignal[], conflicts: GlobalFusionConflict[]): GlobalFusionRisk[] {
  const risks: GlobalFusionRisk[] = [];
  for (let i = 0; i < signals.length; i++) {
    const s = signals[i];
    if ((s.risk ?? 0) < 0.52) continue;
    risks.push({
      id: `gf:risk:sig:${i}`,
      title: `${s.source} risk posture`,
      systems: [s.source] as GlobalFusionSource[],
      severity: (s.risk ?? 0) > 0.78 ? "high" : "medium",
      rationale: s.reason[0] ?? s.provenance,
    });
    if (risks.length >= 4) break;
  }
  for (let i = 0; i < conflicts.length && risks.length < 8; i++) {
    const c = conflicts[i];
    risks.push({
      id: `gf:risk:conf:${i}`,
      title: c.summary,
      systems: c.systems,
      severity: c.severity,
      rationale: c.detail,
    });
  }
  return risks;
}

function uniqueSources(signals: GlobalFusionNormalizedSignal[]): number {
  return new Set(signals.map((s) => s.source)).size;
}

function countInsufficientEvidence(signals: GlobalFusionNormalizedSignal[]): number {
  return signals.filter((s) => (s.evidenceQuality ?? 0) < 0.35).length;
}

function buildHealth(
  scores: GlobalFusionSnapshot["scores"],
  missing: string[],
  conflicts: GlobalFusionConflict[],
  insufficient: number,
): GlobalFusionHealthSummary {
  const observationalWarnings: string[] = [];
  if (missing.length > 2) {
    observationalWarnings.push(`Missing upstream sources: ${missing.slice(0, 4).join(", ")}`);
  }
  if (insufficient > 2) {
    observationalWarnings.push("Several normalized signals report low evidence quality.");
  }
  if (conflicts.filter((c) => c.severity === "high").length > 2) {
    observationalWarnings.push("Multiple high-severity cross-system conflicts detected (advisory).");
  }
  let overallStatus: GlobalFusionHealthSummary["overallStatus"] = "ok";
  if (missing.length > 4 || scores.fusedConfidence < 0.28) overallStatus = "limited";
  else if (scores.fusedRisk > 0.62 || insufficient > 3) overallStatus = "degraded";

  return {
    overallStatus,
    observationalWarnings,
    insufficientEvidenceCount: insufficient,
    missingSourceCount: missing.length,
  };
}

export async function buildGlobalFusionPayload(params: LoadAiControlCenterParams = {}): Promise<GlobalFusionPayload> {
  const started = Date.now();

  if (!globalFusionFlags.globalFusionV1) {
    return {
      enabled: false,
      snapshot: null,
      health: {
        overallStatus: "limited",
        observationalWarnings: ["FEATURE_GLOBAL_FUSION_V1 is off — fusion layer not computed."],
        insufficientEvidenceCount: 0,
        missingSourceCount: 0,
      },
      meta: {
        dataFreshnessMs: Date.now() - started,
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
  }

  const cc = await loadAiControlCenterPayload(params);
  const systems = cc.systems;
  const freshness = cc.meta.dataFreshnessMs;

  const norm = normalizeControlCenterSystems(systems, freshness);
  const mergedMissing = [...new Set([...cc.meta.missingSources, ...norm.missingSources])];
  const conflicts = detectGlobalFusionConflicts(systems, norm.signals);
  const scores = computeGlobalFusionScores(norm.signals, conflicts);
  const recommendations = buildGlobalFusionRecommendations(systems, conflicts, scores);
  const opportunities = buildOpportunities(norm.signals);
  const risks = buildRisks(norm.signals, conflicts);
  const insufficient = countInsufficientEvidence(norm.signals);
  const health = buildHealth(scores, mergedMissing, conflicts, insufficient);

  const snapshot: GlobalFusionSnapshot = {
    generatedAt: new Date().toISOString(),
    opportunities,
    risks,
    recommendations,
    conflicts,
    scores,
    signals: norm.signals,
    influence: null,
  };

  let influenceApplied = false;
  if (globalFusionFlags.globalFusionInfluenceV1) {
    const inf = applyGlobalFusionInfluence({
      opportunities: snapshot.opportunities,
      risks: snapshot.risks,
      recommendations: snapshot.recommendations,
      signals: norm.signals,
      scores,
      conflicts,
      mergedMissingSources: mergedMissing,
      malformedWarnings: norm.malformedWarnings,
      contributingSystemsCount: uniqueSources(norm.signals),
    });
    snapshot.opportunities = inf.opportunities;
    snapshot.risks = inf.risks;
    snapshot.recommendations = inf.recommendations;
    snapshot.influence = inf.result;
    influenceApplied = inf.result.applied && !inf.result.skipped;
  }

  const payload: GlobalFusionPayload = {
    enabled: true,
    snapshot,
    health,
    meta: {
      dataFreshnessMs: Date.now() - started,
      sourcesUsed: [...cc.meta.sourcesUsed, "global_fusion:v1"],
      missingSources: mergedMissing,
      contributingSystemsCount: uniqueSources(norm.signals),
      normalizedSignalCount: norm.signals.length,
      conflictCount: conflicts.length,
      recommendationCount: recommendations.length,
      persistenceLogged: false,
      influenceFlag: globalFusionFlags.globalFusionInfluenceV1,
      primaryFlag: globalFusionFlags.globalFusionPrimaryV1,
      influenceApplied,
      malformedNormalizedCount: norm.malformedWarnings.length,
    },
  };

  const disagreementRateHint = conflicts.length / Math.max(1, norm.signals.length);

  logGlobalFusionPayload(payload, {
    insufficientEvidenceCount: insufficient,
    malformedSignalCount: norm.malformedWarnings.length,
    disagreementRateHint,
  });

  payload.meta.persistenceLogged = maybeLogGlobalFusionPersistenceStub(payload);

  return payload;
}
