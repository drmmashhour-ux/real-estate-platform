/**
 * Compares two V3 snapshots — no fabricated deltas; missing baseline → insufficient data.
 */
import type { AiControlCenterSystems } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV3Payload } from "@/modules/control-center-v3/company-command-center-v3.types";
import type { CommandCenterSystemDelta } from "../company-command-center-v4.types";
import { compareStatusRisk } from "../control-center-v4-status-mapper";

function pushMetric(lines: string[], label: string, prev: number | null, curr: number | null) {
  if (prev == null || curr == null) return;
  if (prev !== curr) lines.push(`${label}: ${prev} → ${curr}`);
}

function pushStrMetric(lines: string[], label: string, prev: string | null, curr: string | null) {
  if (prev == null && curr == null) return;
  if (prev !== curr) lines.push(`${label} changed`);
}

export function buildSystemDeltas(
  current: CompanyCommandCenterV3Payload | null,
  previous: CompanyCommandCenterV3Payload | null,
): { systems: CommandCenterSystemDelta[]; insufficientBaseline: boolean; executiveSummary: string[] } {
  if (!current?.shared.systems || !previous?.shared.systems) {
    return {
      systems: [],
      insufficientBaseline: true,
      executiveSummary: ["Insufficient baseline: previous or current system snapshot unavailable."],
    };
  }

  const c = current.shared.systems;
  const p = previous.shared.systems;

  const systems: CommandCenterSystemDelta[] = [
    deltaBrain(p.brain, c.brain),
    deltaAds(p.ads, c.ads),
    deltaCro(p.cro, c.cro),
    deltaRanking(p.ranking, c.ranking),
    deltaOperator(p.operator, c.operator),
    deltaPlatform(p.platformCore, c.platformCore),
    deltaFusion(p.fusion, c.fusion),
    deltaGrowthLoop(p.growthLoop, c.growthLoop),
    deltaSwarm(p.swarm, c.swarm),
  ];

  const executiveSummary = buildExecutiveBullets(systems, current, previous);

  return {
    systems,
    insufficientBaseline: false,
    executiveSummary,
  };
}

function riskShiftForSystem(
  prev: import("@/modules/control-center/ai-control-center.types").ControlCenterUnifiedStatus,
  curr: import("@/modules/control-center/ai-control-center.types").ControlCenterUnifiedStatus,
): "up" | "down" | "flat" | undefined {
  const x = compareStatusRisk(prev, curr);
  return x === "flat" ? undefined : x;
}

function deltaBrain(
  prev: AiControlCenterSystems["brain"],
  curr: AiControlCenterSystems["brain"],
): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushMetric(changedMetrics, "Fallback %", prev.fallbackRatePct, curr.fallbackRatePct);
  pushMetric(changedMetrics, "Warnings", prev.warningCount, curr.warningCount);
  const changed = changedMetrics.length > 0 || prev.status !== curr.status;
  const summary =
    prev.status !== curr.status
      ? `Status ${prev.status} → ${curr.status}`
      : changedMetrics[0] ?? "No material change detected in compared fields.";
  return {
    system: "brain",
    changed,
    summary,
    changedMetrics,
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaAds(prev: AiControlCenterSystems["ads"], curr: AiControlCenterSystems["ads"]): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushMetric(changedMetrics, "Risky run %", prev.pctRunsRisky, curr.pctRunsRisky);
  const changed = changedMetrics.length > 0 || prev.status !== curr.status;
  return {
    system: "ads",
    changed,
    summary: prev.status !== curr.status ? `Status ${prev.status} → ${curr.status}` : changedMetrics[0] ?? "Stable vs prior window.",
    changedMetrics,
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaCro(prev: AiControlCenterSystems["cro"], curr: AiControlCenterSystems["cro"]): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushStrMetric(changedMetrics, "Top bottleneck", prev.topBottleneck, curr.topBottleneck);
  const changed = changedMetrics.length > 0 || prev.status !== curr.status;
  return {
    system: "cro",
    changed,
    summary: prev.topBottleneck !== curr.topBottleneck && curr.topBottleneck ? `Bottleneck: ${curr.topBottleneck}` : changedMetrics[0] ?? "No bottleneck change flagged.",
    changedMetrics,
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaRanking(
  prev: AiControlCenterSystems["ranking"],
  curr: AiControlCenterSystems["ranking"],
): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushMetric(changedMetrics, "Total score", prev.totalScore, curr.totalScore);
  pushMetric(changedMetrics, "Warnings count", prev.warningsCount, curr.warningsCount);
  const rb = prev.rollbackAny !== curr.rollbackAny ? ["Rollback flag changed"] : [];
  const changed = changedMetrics.length > 0 || rb.length > 0 || prev.status !== curr.status;
  return {
    system: "ranking",
    changed,
    summary:
      rb.length > 0
        ? `Rollback signal: ${curr.rollbackAny ? "on" : "off"} (was ${prev.rollbackAny ? "on" : "off"})`
        : changedMetrics[0] ?? "No score change in compared fields.",
    changedMetrics: [...changedMetrics, ...rb],
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaOperator(
  prev: AiControlCenterSystems["operator"],
  curr: AiControlCenterSystems["operator"],
): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushMetric(changedMetrics, "Conflicts", prev.conflictCount, curr.conflictCount);
  pushMetric(changedMetrics, "Plans", prev.planCount, curr.planCount);
  const changed = changedMetrics.length > 0 || prev.status !== curr.status;
  return {
    system: "operator",
    changed,
    summary: changedMetrics[0] ?? "No conflict/plan delta in compared fields.",
    changedMetrics,
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaPlatform(
  prev: AiControlCenterSystems["platformCore"],
  curr: AiControlCenterSystems["platformCore"],
): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushMetric(changedMetrics, "Overdue schedules", prev.overdueSchedules, curr.overdueSchedules);
  pushMetric(changedMetrics, "Blocked decisions", prev.blockedDecisions, curr.blockedDecisions);
  const changed = changedMetrics.length > 0 || prev.status !== curr.status;
  return {
    system: "platform_core",
    changed,
    summary: changedMetrics[0] ?? "No overdue/blocked delta in compared fields.",
    changedMetrics,
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaFusion(prev: AiControlCenterSystems["fusion"], curr: AiControlCenterSystems["fusion"]): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushMetric(changedMetrics, "Conflicts", prev.conflictCount, curr.conflictCount);
  const changed = changedMetrics.length > 0 || prev.status !== curr.status;
  return {
    system: "fusion",
    changed,
    summary: changedMetrics[0] ?? "No fusion conflict delta in compared fields.",
    changedMetrics,
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaGrowthLoop(
  prev: AiControlCenterSystems["growthLoop"],
  curr: AiControlCenterSystems["growthLoop"],
): CommandCenterSystemDelta {
  const changed = prev.lastRunStatus !== curr.lastRunStatus || prev.status !== curr.status;
  return {
    system: "growth_loop",
    changed,
    summary: prev.lastRunStatus !== curr.lastRunStatus ? `Last run: ${prev.lastRunStatus ?? "n/a"} → ${curr.lastRunStatus ?? "n/a"}` : "Growth loop status stable in compared fields.",
    changedMetrics: [],
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function deltaSwarm(prev: AiControlCenterSystems["swarm"], curr: AiControlCenterSystems["swarm"]): CommandCenterSystemDelta {
  const changedMetrics: string[] = [];
  pushMetric(changedMetrics, "Conflicts", prev.conflictCount, curr.conflictCount);
  pushMetric(changedMetrics, "Human reviews", prev.humanReviewCount, curr.humanReviewCount);
  const changed = changedMetrics.length > 0 || prev.status !== curr.status;
  return {
    system: "swarm",
    changed,
    summary: changedMetrics[0] ?? "No swarm conflict delta in compared fields.",
    changedMetrics,
    riskShift: riskShiftForSystem(prev.status, curr.status),
  };
}

function buildExecutiveBullets(
  systems: CommandCenterSystemDelta[],
  current: CompanyCommandCenterV3Payload,
  previous: CompanyCommandCenterV3Payload,
): string[] {
  const out: string[] = [];

  if (current.shared.overallStatus !== previous.shared.overallStatus) {
    out.push(`Executive posture: ${previous.shared.overallStatus} → ${current.shared.overallStatus}`);
  }

  const worsened = systems.filter((s) => s.riskShift === "up");
  const improved = systems.filter((s) => s.riskShift === "down");

  if (improved.length) {
    out.push(`Largest improvement signal: ${improved.map((x) => x.system).join(", ")} (risk posture eased vs prior window).`);
  }
  if (worsened.length) {
    out.push(`Largest regression signal: ${worsened.map((x) => x.system).join(", ")} (risk posture tightened vs prior window).`);
  }

  const newOpp = current.roles.founder.topPriorities[0]?.label;
  const oldOpp = previous.roles.founder.topPriorities[0]?.label;
  if (newOpp && oldOpp && newOpp !== oldOpp) {
    out.push("Top founder priority narrative shifted (compare priority lists).");
  }

  const newRisk = current.roles.founder.topRisks[0]?.label;
  const oldRisk = previous.roles.founder.topRisks[0]?.label;
  if (newRisk && oldRisk && newRisk !== oldRisk) {
    out.push("Top founder risk narrative shifted (compare risk lists).");
  }

  if (out.length === 0) {
    out.push("No strong cross-system shift detected in compared fields — windows may be similar.");
  }

  return out.slice(0, 6);
}
