/**
 * Normalize Brain / Ads / CRO / Ranking control-center summaries into bounded signals (read-only; no source mutation).
 */
import type { AiControlCenterSystems } from "@/modules/control-center/ai-control-center.types";
import type { GlobalFusionNormalizedSignal, GlobalFusionSource } from "./global-fusion.types";

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

function statusToRisk(status: string): number {
  const s = status.toLowerCase();
  if (s === "critical") return 0.95;
  if (s === "warning") return 0.65;
  if (s === "limited") return 0.45;
  if (s === "healthy") return 0.15;
  return 0.5;
}

function statusToConfidence(status: string): number {
  const s = status.toLowerCase();
  if (s === "healthy") return 0.85;
  if (s === "limited") return 0.55;
  if (s === "warning") return 0.4;
  if (s === "critical") return 0.25;
  return 0.35;
}

export type NormalizeResult = {
  signals: GlobalFusionNormalizedSignal[];
  missingSources: string[];
  malformedWarnings: string[];
};

function signalBase(
  source: GlobalFusionSource,
  id: string,
  partial: Omit<GlobalFusionNormalizedSignal, "id" | "source" | "timestamp"> & { timestamp?: string },
): GlobalFusionNormalizedSignal {
  return {
    id: `${source}:${id}`,
    source,
    timestamp: partial.timestamp ?? new Date().toISOString(),
    targetType: partial.targetType,
    targetId: partial.targetId,
    confidence: partial.confidence,
    priority: partial.priority,
    risk: partial.risk,
    evidenceQuality: partial.evidenceQuality,
    recommendationType: partial.recommendationType,
    reason: partial.reason,
    blockers: partial.blockers,
    metrics: partial.metrics,
    freshnessMs: partial.freshnessMs ?? null,
    provenance: partial.provenance,
  };
}

export function normalizeControlCenterSystems(
  systems: AiControlCenterSystems | null,
  freshnessMs: number | null,
): NormalizeResult {
  const malformedWarnings: string[] = [];
  const missingSources: string[] = [];
  const signals: GlobalFusionNormalizedSignal[] = [];

  if (!systems) {
    missingSources.push("control_center:systems_null");
    return { signals, missingSources, malformedWarnings };
  }

  try {
    const b = systems.brain;
    const brainConf = b.fallbackRatePct != null ? clamp01(1 - b.fallbackRatePct / 100) : statusToConfidence(b.status);
    signals.push(
      signalBase("brain", "trust_stability", {
        targetType: "subsystem",
        targetId: "brain_v8",
        confidence: brainConf,
        priority: clamp01((b.warningCount ?? 0) > 4 ? 0.85 : 0.45),
        risk: statusToRisk(b.status),
        evidenceQuality: b.comparisonRuns != null && b.comparisonRuns > 0 ? 0.7 : 0.35,
        recommendationType: b.topRecommendation ? "follow_top" : "observe",
        reason: [b.summary, b.topIssue ? `issue:${b.topIssue}` : ""].filter(Boolean),
        blockers: !b.shadowObservationEnabled ? ["shadow_observation_off"] : [],
        metrics: {
          fallbackRatePct: b.fallbackRatePct,
          warningCount: b.warningCount,
          comparisonRuns: b.comparisonRuns,
        },
        freshnessMs,
        provenance: "ai_control_center:brain",
      }),
    );
  } catch (e) {
    malformedWarnings.push(`brain:${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const a = systems.ads;
    const adsRisk =
      a.pctRunsRisky != null ? clamp01(a.pctRunsRisky / 100) : statusToRisk(a.status);
    signals.push(
      signalBase("ads", "campaign_quality", {
        targetType: "subsystem",
        targetId: "ads_v8",
        confidence: a.avgOverlapRate != null ? clamp01(a.avgOverlapRate) : statusToConfidence(a.status),
        priority: adsRisk > 0.5 ? 0.8 : 0.4,
        risk: adsRisk,
        evidenceQuality: a.comparisonRuns != null && a.comparisonRuns > 0 ? 0.65 : 0.3,
        recommendationType: a.anomalyNote ? "anomaly_review" : "scale_cautiously",
        reason: [a.summary, a.anomalyNote ?? ""].filter(Boolean),
        blockers: !a.shadowMode && !a.v8Rollout ? ["ads_v8_layers_minimal"] : [],
        metrics: {
          runs: a.comparisonRuns,
          pctRunsRisky: a.pctRunsRisky,
          avgDivergenceRate: a.avgDivergenceRate,
        },
        freshnessMs,
        provenance: "ai_control_center:ads",
      }),
    );
  } catch (e) {
    malformedWarnings.push(`ads:${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const c = systems.cro;
    const croHealth = c.healthScore != null ? clamp01(c.healthScore / 100) : null;
    signals.push(
      signalBase("cro", "funnel_health", {
        targetType: "subsystem",
        targetId: "cro_v8",
        confidence: croHealth,
        priority: croHealth != null && croHealth < 0.45 ? 0.9 : 0.42,
        risk: croHealth != null ? 1 - croHealth : statusToRisk(c.status),
        evidenceQuality: c.recommendationCount != null && c.recommendationCount > 0 ? 0.6 : 0.25,
        recommendationType: c.topBottleneck ? "reduce_bottleneck" : "observe_funnel",
        reason: [c.summary, c.topBottleneck ?? "", c.warningSummary ?? ""].filter(Boolean),
        blockers: !c.analysisEnabled ? ["cro_analysis_disabled"] : [],
        metrics: {
          healthScore: c.healthScore,
          recommendationCount: c.recommendationCount,
        },
        freshnessMs,
        provenance: "ai_control_center:cro",
      }),
    );
  } catch (e) {
    malformedWarnings.push(`cro:${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const r = systems.ranking;
    const roll = (r.recommendation ?? "").toLowerCase();
    signals.push(
      signalBase("ranking", "rollout_readiness", {
        targetType: "subsystem",
        targetId: "ranking_v8",
        confidence:
          r.readinessGatesOk != null && r.readinessGatesTotal != null
            ? clamp01(r.readinessGatesOk / Math.max(1, r.readinessGatesTotal))
            : statusToConfidence(r.status),
        priority: r.rollbackAny ? 0.95 : roll.includes("expand") ? 0.55 : 0.4,
        risk: r.rollbackAny ? 0.85 : statusToRisk(r.status),
        evidenceQuality: r.totalScore != null && r.maxScore != null ? clamp01(r.totalScore / r.maxScore) : 0.4,
        recommendationType: r.recommendation ?? "unknown",
        reason: [r.summary].filter(Boolean),
        blockers: r.rollbackAny ? ["rollback_signal"] : [],
        metrics: {
          totalScore: r.totalScore,
          maxScore: r.maxScore,
          warningsCount: r.warningsCount,
        },
        freshnessMs,
        provenance: "ai_control_center:ranking",
      }),
    );
  } catch (e) {
    malformedWarnings.push(`ranking:${e instanceof Error ? e.message : String(e)}`);
  }

  return { signals, missingSources, malformedWarnings };
}
