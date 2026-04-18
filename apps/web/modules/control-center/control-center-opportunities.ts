/**
 * Heuristic extraction of top opportunities / risks for the executive summary — explicit, non-prescriptive.
 */
import type { AiControlCenterPayload } from "./ai-control-center.types";

export function extractTopOpportunities(p: AiControlCenterPayload): string[] {
  const out: string[] = [];
  const { systems: s } = p;

  if (s.ranking.recommendation && rankingRecommendationIsOpp(s.ranking.recommendation)) {
    out.push(`Ranking V8: ${s.ranking.recommendation.replace(/_/g, " ")}`);
  }
  if (s.cro.recommendationCount != null && s.cro.recommendationCount > 0 && s.cro.healthScore != null && s.cro.healthScore >= 60) {
    out.push(`CRO V8: ${s.cro.recommendationCount} shadow recommendation(s) — review funnel fixes`);
  }
  if (s.fusion.topRecommendation) {
    out.push(`Fusion: ${s.fusion.topRecommendation}`);
  }
  if (s.ads.v8Rollout && !s.ads.primaryEnabled && (s.ads.pctRunsRisky == null || s.ads.pctRunsRisky < 20)) {
    out.push("Ads V8: V8 rollout active without primary — review comparison quality before widening");
  }
  if (s.brain.primaryEnabled && s.brain.fallbackRatePct != null && s.brain.fallbackRatePct < 12) {
    out.push("Brain V8 primary: fallback rate within observed guardrails");
  }
  if (s.operator.executionPlanFlag && s.operator.conflictEngineFlag) {
    out.push("Operator V2: conflict engine + execution plan enabled — use assistant for ranked actions");
  }
  return out.slice(0, 8);
}

export function extractTopRisks(p: AiControlCenterPayload): string[] {
  const out: string[] = [];
  const { systems: s } = p;

  if (s.ranking.rollbackAny) {
    out.push("Ranking V8: rollback signal(s) raised — review overlap/stability");
  }
  if (s.ranking.recommendation === "rollback_recommended") {
    out.push("Ranking V8: rollback_recommended in governance advisory");
  }
  if (s.brain.fallbackRatePct != null && s.brain.fallbackRatePct > 35) {
    out.push(`Brain V8: elevated primary fallback rate (~${s.brain.fallbackRatePct.toFixed(0)}%)`);
  }
  if (s.ads.pctRunsRisky != null && s.ads.pctRunsRisky > 40) {
    out.push(`Ads V8: high risky comparison run rate (${s.ads.pctRunsRisky.toFixed(0)}%)`);
  }
  if (s.cro.healthScore != null && s.cro.healthScore < 40) {
    out.push(`CRO V8: low funnel health score (${s.cro.healthScore})`);
  }
  for (const w of s.platformCore.healthWarnings.slice(0, 2)) {
    out.push(`Platform Core: ${w}`);
  }
  if (s.fusion.conflictCount != null && s.fusion.conflictCount > 6) {
    out.push(`Fusion: elevated cross-domain conflicts (${s.fusion.conflictCount})`);
  }
  return out.slice(0, 8);
}

function rankingRecommendationIsOpp(rec: string) {
  return rec === "candidate_for_primary" || rec === "expand_phase_c" || rec === "phase_c_only";
}

export function mergeCriticalWarnings(p: AiControlCenterPayload): string[] {
  return p.unifiedWarnings.slice(0, 12);
}

export function countSystemBuckets(systems: AiControlCenterPayload["systems"]): {
  healthy: number;
  warning: number;
  critical: number;
} {
  let healthy = 0;
  let warning = 0;
  let critical = 0;
  for (const s of Object.values(systems)) {
    switch (s.status) {
      case "healthy":
      case "disabled":
        healthy += 1;
        break;
      case "limited":
      case "unavailable":
      case "warning":
        warning += 1;
        break;
      case "critical":
        critical += 1;
        break;
      default:
        warning += 1;
    }
  }
  return { healthy, warning, critical };
}
