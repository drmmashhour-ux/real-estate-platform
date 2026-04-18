/**
 * Heuristic extraction for role views — uses only fields already present on V1/V2 payloads.
 */
import type { CompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.types";
import type { CommandCenterRoleBlocker } from "./company-command-center-v3.types";
import { capPriorities } from "./control-center-v3-priority-mapper";

export function systemNeedsAttention(status: string): boolean {
  return status === "warning" || status === "critical" || status === "limited";
}

export function systemsNeedingAttentionLabels(v2: CompanyCommandCenterV2Payload): string[] {
  const s = v2.v1.systems;
  const rows: { id: string; label: string; st: string }[] = [
    { id: "brain", label: "Brain V8", st: s.brain.status },
    { id: "ads", label: "Ads V8", st: s.ads.status },
    { id: "cro", label: "CRO V8", st: s.cro.status },
    { id: "ranking", label: "Ranking V8", st: s.ranking.status },
    { id: "operator", label: "Operator V2", st: s.operator.status },
    { id: "platform_core", label: "Platform Core", st: s.platformCore.status },
    { id: "fusion", label: "Fusion", st: s.fusion.status },
    { id: "growth_loop", label: "Growth loop", st: s.growthLoop.status },
    { id: "swarm", label: "Swarm", st: s.swarm.status },
  ];
  return rows.filter((r) => systemNeedsAttention(r.st)).map((r) => r.label);
}

export function extractStrategicBlockers(v2: CompanyCommandCenterV2Payload): CommandCenterRoleBlocker[] {
  const v1 = v2.v1;
  const out: CommandCenterRoleBlocker[] = [];
  const blocked = v1.rolloutSummary.blockedSystems;
  if (blocked.length) {
    out.push({
      id: "rollout-blocked",
      label: `Rollout blocked: ${blocked.slice(0, 2).join(", ")}${blocked.length > 2 ? "…" : ""}`,
      rationale: null,
    });
  }
  const bd = v1.systems.platformCore.blockedDecisions ?? 0;
  if (bd > 0) {
    out.push({ id: "platform-blocked", label: `${bd} blocked platform decision(s)`, rationale: null });
  }
  const overdue = v1.systems.platformCore.overdueSchedules ?? 0;
  if (overdue > 0) {
    out.push({ id: "overdue-sched", label: `${overdue} overdue schedule(s)`, rationale: null });
  }
  return capPriorities(out, 5);
}

export function extractGrowthBottleneckStrings(v2: CompanyCommandCenterV2Payload): string[] {
  const s = v2.v1.systems;
  const out: string[] = [];
  if (s.cro.topBottleneck) out.push(`CRO: ${s.cro.topBottleneck}`);
  if (s.cro.dropoffSummary) out.push(`Drop-off: ${s.cro.dropoffSummary}`);
  if (s.ads.anomalyNote) out.push(`Ads: ${s.ads.anomalyNote}`);
  return out.slice(0, 5);
}

export function extractOperationalBlockers(v2: CompanyCommandCenterV2Payload): CommandCenterRoleBlocker[] {
  const s = v2.v1.systems;
  const out: CommandCenterRoleBlocker[] = [];
  const cc = s.operator.conflictCount ?? 0;
  if (cc > 0) out.push({ id: "op-conflicts", label: `${cc} operator conflict(s)`, rationale: null });
  const hrc = s.swarm.humanReviewCount ?? 0;
  if (hrc > 0) out.push({ id: "swarm-review", label: `${hrc} swarm human review(s)`, rationale: null });
  const pending = s.platformCore.pendingDecisions ?? 0;
  if (pending > 0) out.push({ id: "pending", label: `${pending} pending platform decision(s)`, rationale: null });
  return capPriorities([...extractStrategicBlockers(v2), ...out], 8);
}

export function extractGovernanceRiskStrings(v2: CompanyCommandCenterV2Payload): string[] {
  const s = v2.v1.systems;
  const out: string[] = [];
  if (s.ranking.rollbackAny) out.push("Ranking rollback signal present");
  if (s.brain.fallbackRatePct != null && s.brain.fallbackRatePct > 15) {
    out.push(`Brain fallback rate elevated (${s.brain.fallbackRatePct.toFixed(1)}%)`);
  }
  if (s.fusion.conflictCount != null && s.fusion.conflictCount > 0) {
    out.push(`Fusion conflict count: ${s.fusion.conflictCount}`);
  }
  if (s.fusion.agreementHint) out.push(`Fusion: ${s.fusion.agreementHint}`);
  return out.slice(0, 8);
}

export function founderWatchNow(v2: CompanyCommandCenterV2Payload): string[] {
  const w = [...v2.v1.executiveSummary.criticalWarnings, ...v2.v1.unifiedWarnings.slice(0, 6)];
  return [...new Set(w.map((x) => x.trim()).filter(Boolean))].slice(0, 6);
}
