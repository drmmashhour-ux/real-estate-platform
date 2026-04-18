import type { CompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.types";
import type { CommandCenterRolePriority, CommandCenterRoleView } from "../company-command-center-v3.types";
import { capPriorities, stringsToPriorities } from "../control-center-v3-priority-mapper";
import {
  extractStrategicBlockers,
  founderWatchNow,
  systemNeedsAttention,
  systemsNeedingAttentionLabels,
} from "../company-command-center-v3-extraction";

function prioritiesFromExecutive(v2: CompanyCommandCenterV2Payload): CommandCenterRolePriority[] {
  const top = v2.v1.executiveSummary.topOpportunities;
  const ids = top.map((_, i) => `exec-opp-${i}`);
  return capPriorities(stringsToPriorities(ids, top), 3);
}

export function mapFounderRole(v2: CompanyCommandCenterV2Payload): CommandCenterRoleView {
  const es = v2.v1.executiveSummary;
  const rs = v2.v1.rolloutSummary;
  const heroSummary = [
    `Executive posture: ${es.overallStatus}.`,
    `Systems — healthy/disabled: ${es.systemsHealthyCount}, warning: ${es.systemsWarningCount}, critical: ${es.systemsCriticalCount}.`,
    v2.v1.systems.growthLoop.notes ? `Growth loop note: ${v2.v1.systems.growthLoop.notes}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const topRisks = capPriorities(
    stringsToPriorities(
      es.topRisks.map((_, i) => `risk-${i}`),
      es.topRisks,
    ),
    3,
  );

  const attention = systemsNeedingAttentionLabels(v2);
  const s = v2.v1.systems;
  const highlightRows = [
    { id: "brain", label: "Brain V8", st: s.brain.status, line: s.brain.summary.slice(0, 100) },
    { id: "ads", label: "Ads V8", st: s.ads.status, line: s.ads.summary.slice(0, 100) },
    { id: "cro", label: "CRO V8", st: s.cro.status, line: s.cro.summary.slice(0, 100) },
    { id: "ranking", label: "Ranking V8", st: s.ranking.status, line: s.ranking.summary.slice(0, 100) },
    { id: "operator", label: "Operator V2", st: s.operator.status, line: s.operator.summary.slice(0, 100) },
    { id: "platform_core", label: "Platform Core", st: s.platformCore.status, line: s.platformCore.summary.slice(0, 100) },
    { id: "fusion", label: "Fusion", st: s.fusion.status, line: s.fusion.summary.slice(0, 100) },
    { id: "growth_loop", label: "Growth loop", st: s.growthLoop.status, line: s.growthLoop.summary.slice(0, 100) },
    { id: "swarm", label: "Swarm", st: s.swarm.status, line: s.swarm.summary.slice(0, 100) },
  ];
  const highlights = highlightRows
    .filter((r) => systemNeedsAttention(r.st))
    .slice(0, 6)
    .map((r) => ({ id: r.id, label: r.label, status: r.st, oneLiner: r.line }));

  return {
    role: "founder",
    heroSummary,
    topPriorities: prioritiesFromExecutive(v2),
    topRisks,
    topBlockers: extractStrategicBlockers(v2),
    recommendedFocusAreas: mergeUniqueFocus(es.overallStatus, attention),
    systems: { highlights },
    rolloutSummary: rs,
    warnings: founderWatchNow(v2),
  };
}

function mergeUniqueFocus(overall: string, attention: string[]): string[] {
  const base = overall !== "healthy" ? [`Stabilize overall posture (${overall})`] : [];
  return [...new Set([...base, ...attention.map((a) => `Review ${a}`)])].slice(0, 6);
}
