/**
 * Cross-system conflict hints (advisory only — no enforcement).
 */
import type { AiControlCenterSystems } from "@/modules/control-center/ai-control-center.types";
import type {
  GlobalFusionConflict,
  GlobalFusionConflictRecommendation,
  GlobalFusionConflictSeverity,
  GlobalFusionNormalizedSignal,
  GlobalFusionSource,
} from "./global-fusion.types";

function id(s: string): string {
  return `gf:${s}`;
}

function sev(s: GlobalFusionConflictSeverity): GlobalFusionConflictSeverity {
  return s;
}

function rec(r: GlobalFusionConflictRecommendation): GlobalFusionConflictRecommendation {
  return r;
}

export function detectGlobalFusionConflicts(
  systems: AiControlCenterSystems,
  _signals: GlobalFusionNormalizedSignal[],
): GlobalFusionConflict[] {
  const out: GlobalFusionConflict[] = [];

  const brainLow =
    systems.brain.status === "warning" ||
    systems.brain.status === "critical" ||
    (systems.brain.fallbackRatePct != null && systems.brain.fallbackRatePct > 40);
  const adsAggressive =
    systems.ads.status === "healthy" &&
    systems.ads.pctRunsRisky != null &&
    systems.ads.pctRunsRisky < 20;
  const croWeak =
    systems.cro.healthScore != null
      ? systems.cro.healthScore < 50
      : systems.cro.status === "warning" || systems.cro.status === "critical";
  const rankExpand = (systems.ranking.recommendation ?? "").toLowerCase().includes("expand");
  const rankRollback = systems.ranking.rollbackAny === true;

  if (adsAggressive && croWeak) {
    out.push({
      id: id("ads_scale_cro_weak"),
      systems: ["ads", "cro"],
      severity: sev("medium"),
      summary: "Ads signals lean healthy while CRO funnel health is weak — prioritize funnel fixes before scaling demand.",
      recommendation: rec("proceed_with_caution"),
      detail: "Derived from control-center ads status vs CRO healthScore/threshold.",
    });
  }

  if (rankExpand && brainLow) {
    out.push({
      id: id("ranking_expand_brain_caution"),
      systems: ["ranking", "brain"],
      severity: sev("medium"),
      summary: "Ranking suggests expansion posture while Brain confidence/stability signals are strained.",
      recommendation: rec("monitor_only"),
      detail: "Ranking recommendation contains expand heuristic vs Brain warning/critical or high fallback.",
    });
  }

  if (rankRollback && adsAggressive) {
    out.push({
      id: id("rollback_vs_ads"),
      systems: ["ranking", "ads"],
      severity: sev("high"),
      summary: "Ranking rollback risk present while Ads aggregate looks favorable — verify comparison quality.",
      recommendation: rec("require_human_review"),
      detail: "rollbackAny on ranking vs healthy-leaning ads snapshot.",
    });
  }

  const croUrgent = systems.cro.topBottleneck != null && (systems.cro.healthScore ?? 100) < 45;
  const rankInstable = (systems.ranking.warningsCount ?? 0) > 4 || rankRollback;
  if (croUrgent && rankInstable) {
    out.push({
      id: id("cro_urgent_ranking_instability"),
      systems: ["cro", "ranking"],
      severity: sev("high"),
      summary: "CRO bottleneck urgency overlaps ranking instability — defer broad rollout until stabilized.",
      recommendation: rec("defer"),
      detail: "Heuristic from CRO bottleneck + ranking warnings/rollback.",
    });
  }

  return out;
}

export function sourcesInConflict(conflicts: GlobalFusionConflict[]): Set<GlobalFusionSource> {
  const s = new Set<GlobalFusionSource>();
  for (const c of conflicts) {
    for (const x of c.systems) s.add(x);
  }
  return s;
}
