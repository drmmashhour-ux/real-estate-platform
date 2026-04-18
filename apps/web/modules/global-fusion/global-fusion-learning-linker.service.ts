/**
 * Links Fusion-normalized signals to proxy outcomes from read-only control-center summaries.
 * Does not mutate source rows or invent strong links without evidence.
 */
import type { AiControlCenterSystems } from "@/modules/control-center/ai-control-center.types";
import type {
  GlobalFusionLearningOutcome,
  GlobalFusionLearningSignal,
  GlobalFusionNormalizedSignal,
  GlobalFusionScore,
} from "./global-fusion.types";

function statusScore(status: string): number {
  const s = status.toLowerCase();
  if (s === "healthy") return 1;
  if (s === "limited") return 0.65;
  if (s === "warning") return 0.4;
  if (s === "critical") return 0.15;
  return 0.5;
}

function proxyOutcomeForSource(
  source: GlobalFusionLearningSignal["sourceSystems"][number],
  systems: AiControlCenterSystems,
): { success: boolean | null; linkageStrength: GlobalFusionLearningOutcome["linkageStrength"]; notes: string } {
  if (source === "brain") {
    const st = systems.brain.status;
    return {
      success: statusScore(st) >= 0.55,
      linkageStrength: "weak",
      notes: "proxy:brain_status",
    };
  }
  if (source === "ads") {
    const risky = systems.ads.pctRunsRisky;
    const ok = risky != null ? risky < 35 : statusScore(systems.ads.status) >= 0.55;
    return {
      success: ok,
      linkageStrength: risky == null ? "weak" : "strong",
      notes: "proxy:ads_risk_and_status",
    };
  }
  if (source === "cro") {
    const h = systems.cro.healthScore;
    if (h == null) {
      return { success: null, linkageStrength: "unavailable", notes: "cro_health_missing" };
    }
    return {
      success: h >= 55,
      linkageStrength: "strong",
      notes: "proxy:cro_healthScore",
    };
  }
  if (source === "ranking") {
    const rb = systems.ranking.rollbackAny;
    return {
      success: !rb && statusScore(systems.ranking.status) >= 0.55,
      linkageStrength: "weak",
      notes: "proxy:ranking_rollback_and_status",
    };
  }
  return { success: null, linkageStrength: "unavailable", notes: "unknown_source" };
}

export function buildLearningSignalsFromNormalized(
  signals: GlobalFusionNormalizedSignal[],
  scores: GlobalFusionScore,
): GlobalFusionLearningSignal[] {
  const now = new Date().toISOString();
  return signals.map((s) => ({
    signalId: s.id,
    sourceSystems: [s.source],
    targetType: s.targetType,
    targetId: s.targetId,
    recommendationType: s.recommendationType,
    fusedConfidence: scores.fusedConfidence,
    fusedPriority: scores.fusedPriority,
    fusedRisk: scores.fusedRisk,
    evidenceScore: scores.evidenceScore,
    agreementScore: scores.agreementScore,
    emittedAt: now,
  }));
}

export function linkOutcomesToSignals(
  learningSignals: GlobalFusionLearningSignal[],
  systems: AiControlCenterSystems,
): GlobalFusionLearningOutcome[] {
  const observedAt = new Date().toISOString();
  const out: GlobalFusionLearningOutcome[] = [];
  for (const sig of learningSignals) {
    const src = sig.sourceSystems[0];
    if (!src) {
      out.push({
        signalId: sig.signalId,
        observedAt,
        outcomeType: "insufficient_linkage",
        success: null,
        linkageStrength: "unavailable",
        notes: "no_source",
      });
      continue;
    }
    const proxy = proxyOutcomeForSource(src, systems);
    out.push({
      signalId: sig.signalId,
      observedAt,
      outcomeType: proxy.success === true ? "proxy_success" : proxy.success === false ? "proxy_failure" : "unknown",
      success: proxy.success,
      linkageStrength: proxy.linkageStrength,
      notes: proxy.notes,
      source: src,
    });
  }
  return out;
}
