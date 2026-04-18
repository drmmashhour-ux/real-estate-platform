import type { AiControlCenterPayload } from "@/modules/control-center/ai-control-center.types";
import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { CommandCenterWarRoomSummary } from "../company-command-center-v6.types";
import { deriveLaunchReadiness } from "@/modules/control-center-v5/control-center-v5-readiness-mapper";
import { keySystemsNeedingAttention } from "@/modules/control-center-v5/company-command-center-v5-extraction";

export function mapLaunchWarRoomMode(v4: CompanyCommandCenterV4Payload, _v1: AiControlCenterPayload | null): CommandCenterWarRoomSummary {
  const rs = v4.v3.shared.rolloutSummary;
  const readiness = deriveLaunchReadiness(v4.v3.shared.overallStatus, rs);

  const criticalSystems = keySystemsNeedingAttention(v4).map((k) => k.label);

  const blockers: string[] = [];
  for (const b of rs.blockedSystems) blockers.push(`Blocked context: ${b}`);
  if (v4.v3.shared.systems?.ranking.rollbackAny) blockers.push("Ranking rollback signal");

  const goNoGoSignals: string[] = [];
  if (readiness === "go") goNoGoSignals.push("Readiness label: go (heuristic from posture + blocked rollouts).");
  if (readiness === "caution") goNoGoSignals.push("Readiness label: caution — tighten scope.");
  if (readiness === "hold") goNoGoSignals.push("Readiness label: hold — clear blockers first.");

  const escalationItems: string[] = [];
  for (const it of v4.anomalyDigest.items.filter((i) => i.severity === "warning" || i.severity === "critical").slice(0, 8)) {
    escalationItems.push(`${it.system}: ${it.title}`);
  }

  const readinessChecklist: Record<string, boolean> = {
    noBlockedRollouts: rs.blockedSystems.length === 0,
    digestNoCritical: v4.anomalyDigest.countsBySeverity.critical === 0,
    rankingRollbackClear: !(v4.v3.shared.systems?.ranking.rollbackAny ?? false),
    executiveNotCritical: v4.v3.shared.overallStatus !== "critical",
  };

  const launchSummary = `War room snapshot — ${readiness.toUpperCase()}. ${criticalSystems.length} subsystem(s) over attention threshold.`;

  return {
    mode: "launch_war_room",
    launchSummary,
    criticalSystems: criticalSystems.length ? criticalSystems : ["—"],
    blockers: blockers.length ? blockers : ["—"],
    goNoGoSignals,
    escalationItems: escalationItems.length ? escalationItems : ["—"],
    readinessChecklist,
    warnings: [...v4.v3.roles.founder.warnings, ...v4.v3.roles.riskGovernance.warnings.slice(0, 4)].slice(0, 14),
  };
}
