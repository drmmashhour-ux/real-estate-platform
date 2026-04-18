/**
 * Heuristic opportunities / risks per tab — explicit, non-prescriptive.
 */
import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";

export function extractGrowthOpportunities(v1: AiControlCenterPayload): string[] {
  const s = v1.systems;
  const out: string[] = [];
  if (s.ads.v8Rollout && !s.ads.primaryEnabled && (s.ads.pctRunsRisky == null || s.ads.pctRunsRisky < 25)) {
    out.push("Ads V8: V8 rollout without primary — review before widening");
  }
  if (s.cro.recommendationCount != null && s.cro.recommendationCount > 0 && (s.cro.healthScore ?? 0) >= 55) {
    out.push(`CRO V8: ${s.cro.recommendationCount} shadow recommendation(s) to review`);
  }
  if (s.growthLoop.actionsProposed != null && s.growthLoop.actionsProposed > 0) {
    out.push(`Growth loop: ${s.growthLoop.actionsProposed} proposed action(s) in last run`);
  }
  return out.slice(0, 8);
}

export function extractGrowthRisks(v1: AiControlCenterPayload): string[] {
  const s = v1.systems;
  const out: string[] = [];
  if (s.ads.pctRunsRisky != null && s.ads.pctRunsRisky > 35) {
    out.push(`Ads V8: elevated risky comparison rate (${s.ads.pctRunsRisky.toFixed(0)}%)`);
  }
  if (s.cro.healthScore != null && s.cro.healthScore < 45) {
    out.push(`CRO V8: low health score (${s.cro.healthScore})`);
  }
  if (s.ads.anomalyNote) out.push(`Ads: ${s.ads.anomalyNote}`);
  return out.slice(0, 8);
}

export function extractBrainOpportunities(v1: AiControlCenterPayload): string[] {
  const b = v1.systems.brain;
  const out: string[] = [];
  if (b.primaryEnabled && b.fallbackRatePct != null && b.fallbackRatePct < 15) {
    out.push("Brain V8 primary: fallback rate within guardrails (observational)");
  }
  if (b.topRecommendation) out.push(b.topRecommendation);
  return out.slice(0, 6);
}

export function extractBrainRisks(v1: AiControlCenterPayload): string[] {
  const b = v1.systems.brain;
  const out: string[] = [];
  if (b.fallbackRatePct != null && b.fallbackRatePct > 35) {
    out.push(`Brain V8: high fallback rate (~${b.fallbackRatePct.toFixed(0)}%)`);
  }
  if (b.topIssue) out.push(b.topIssue);
  return out.slice(0, 6);
}

export function extractSwarmOpportunities(v1: AiControlCenterPayload): string[] {
  const w = v1.systems.swarm;
  const out: string[] = [];
  if (w.enabled && w.negotiationEnabled) {
    out.push("Swarm: negotiation layer enabled — run dedicated swarm cycle for fresh proposals");
  }
  if (w.topOpportunity) out.push(w.topOpportunity);
  return out.slice(0, 6);
}

export function extractSwarmRisks(v1: AiControlCenterPayload): string[] {
  const w = v1.systems.swarm;
  const out: string[] = [];
  if (w.conflictCount != null && w.conflictCount > 4) {
    out.push(`Swarm: elevated conflict count (${w.conflictCount}) — advisory`);
  }
  if (w.humanReviewCount != null && w.humanReviewCount > 0) {
    out.push(`Swarm: ${w.humanReviewCount} item(s) flagged for human review`);
  }
  if (w.negotiationNote) out.push(w.negotiationNote);
  return out.slice(0, 6);
}
