/**
 * Unified anomaly-style digest from current snapshot only — read-only aggregation.
 */
import type { AiControlCenterSystems } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV3Payload } from "@/modules/control-center-v3/company-command-center-v3.types";
import type { CommandCenterAnomalyDigestItem, CommandCenterDigestSeverity } from "../company-command-center-v4.types";
import { bumpSeverity, unifiedStatusToDigestSeverity } from "../control-center-v4-severity-mapper";

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function buildAnomalyDigest(current: CompanyCommandCenterV3Payload | null): {
  items: CommandCenterAnomalyDigestItem[];
  countsBySeverity: Record<CommandCenterDigestSeverity, number>;
} {
  seq = 0;
  const items: CommandCenterAnomalyDigestItem[] = [];
  if (!current?.shared.systems) {
    return {
      items: [],
      countsBySeverity: { info: 0, watch: 0, warning: 0, critical: 0 },
    };
  }

  const s = current.shared.systems;
  collectAds(items, s);
  collectCro(items, s);
  collectRanking(items, s);
  collectBrain(items, s);
  collectPlatform(items, s);
  collectSwarm(items, s);
  collectFusion(items, s);
  collectGrowthLoop(items, s);
  collectOperator(items, s);

  const countsBySeverity: Record<CommandCenterDigestSeverity, number> = {
    info: 0,
    watch: 0,
    warning: 0,
    critical: 0,
  };
  for (const it of items) {
    countsBySeverity[it.severity] += 1;
  }

  return { items, countsBySeverity };
}

function collectAds(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  if (s.ads.anomalyNote) {
    items.push({
      id: nextId("ads"),
      system: "ads",
      severity: bumpSeverity(unifiedStatusToDigestSeverity(s.ads.status), "warning"),
      title: "Ads anomaly note",
      summary: s.ads.anomalyNote,
      metric: s.ads.pctRunsRisky != null ? `${s.ads.pctRunsRisky}% risky runs` : null,
      delta: null,
      timestamp: null,
    });
  }
}

function collectCro(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  if (s.cro.warningSummary) {
    items.push({
      id: nextId("cro"),
      system: "cro",
      severity: unifiedStatusToDigestSeverity(s.cro.status),
      title: "CRO warning",
      summary: s.cro.warningSummary,
      metric: s.cro.topBottleneck,
      delta: null,
      timestamp: null,
    });
  }
  if (s.cro.dropoffSummary && !s.cro.warningSummary) {
    items.push({
      id: nextId("cro-d"),
      system: "cro",
      severity: "watch",
      title: "CRO drop-off signal",
      summary: s.cro.dropoffSummary,
      metric: null,
      delta: null,
      timestamp: null,
    });
  }
}

function collectRanking(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  if (s.ranking.rollbackAny) {
    items.push({
      id: nextId("rank"),
      system: "ranking",
      severity: "critical",
      title: "Ranking rollback signal",
      summary: s.ranking.recommendation ?? s.ranking.summary.slice(0, 200),
      metric: s.ranking.totalScore != null ? `score ${s.ranking.totalScore}` : null,
      delta: null,
      timestamp: null,
    });
  }
}

function collectBrain(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  if (s.brain.warningCount > 0) {
    items.push({
      id: nextId("brain"),
      system: "brain",
      severity: s.brain.warningCount > 3 ? "warning" : "watch",
      title: "Brain warnings",
      summary: s.brain.topIssue ?? s.brain.summary.slice(0, 200),
      metric: s.brain.fallbackRatePct != null ? `${s.brain.fallbackRatePct.toFixed(1)}% fallback` : null,
      delta: null,
      timestamp: s.brain.lastReportAt,
    });
  }
}

function collectPlatform(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  const od = s.platformCore.overdueSchedules ?? 0;
  const bd = s.platformCore.blockedDecisions ?? 0;
  if (od > 0) {
    items.push({
      id: nextId("pc-od"),
      system: "platform_core",
      severity: od > 2 ? "warning" : "watch",
      title: "Overdue schedules",
      summary: `${od} overdue schedule(s) reported`,
      metric: String(od),
      delta: null,
      timestamp: null,
    });
  }
  if (bd > 0) {
    items.push({
      id: nextId("pc-bd"),
      system: "platform_core",
      severity: "warning",
      title: "Blocked decisions",
      summary: `${bd} blocked decision(s)`,
      metric: String(bd),
      delta: null,
      timestamp: null,
    });
  }
  for (const w of s.platformCore.healthWarnings.slice(0, 3)) {
    items.push({
      id: nextId("pc-h"),
      system: "platform_core",
      severity: "watch",
      title: "Platform health",
      summary: w,
      metric: null,
      delta: null,
      timestamp: null,
    });
  }
}

function collectSwarm(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  const cc = s.swarm.conflictCount ?? 0;
  if (cc > 0) {
    items.push({
      id: nextId("sw"),
      system: "swarm",
      severity: cc > 3 ? "warning" : "watch",
      title: "Swarm conflicts",
      summary: s.swarm.negotiationNote ?? `${cc} conflict(s)`,
      metric: String(cc),
      delta: null,
      timestamp: null,
    });
  }
  const hr = s.swarm.humanReviewCount ?? 0;
  if (hr > 0) {
    items.push({
      id: nextId("sw-hr"),
      system: "swarm",
      severity: "watch",
      title: "Human review queue",
      summary: `${hr} item(s) awaiting review`,
      metric: String(hr),
      delta: null,
      timestamp: null,
    });
  }
}

function collectFusion(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  const fc = s.fusion.conflictCount ?? 0;
  if (fc > 0) {
    items.push({
      id: nextId("fu"),
      system: "fusion",
      severity: "warning",
      title: "Fusion conflicts",
      summary: s.fusion.agreementHint ?? `${fc} fusion conflict(s)`,
      metric: String(fc),
      delta: null,
      timestamp: null,
    });
  }
}

function collectGrowthLoop(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  const st = s.growthLoop.lastRunStatus;
  if (st && /fail|error|blocked/i.test(st)) {
    items.push({
      id: nextId("gl"),
      system: "growth_loop",
      severity: "warning",
      title: "Growth loop run",
      summary: s.growthLoop.notes ?? st,
      metric: st,
      delta: null,
      timestamp: s.growthLoop.lastRunAt,
    });
  }
}

function collectOperator(items: CommandCenterAnomalyDigestItem[], s: AiControlCenterSystems) {
  const cc = s.operator.conflictCount ?? 0;
  if (cc > 0) {
    items.push({
      id: nextId("op"),
      system: "operator",
      severity: cc > 2 ? "warning" : "watch",
      title: "Operator conflicts",
      summary: s.operator.topRecommendation ?? `${cc} conflict(s)`,
      metric: String(cc),
      delta: null,
      timestamp: null,
    });
  }
}
