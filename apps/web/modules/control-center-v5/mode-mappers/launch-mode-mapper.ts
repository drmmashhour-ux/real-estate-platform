import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { LaunchModeView } from "../company-command-center-v5.types";
import { deriveLaunchReadiness } from "../control-center-v5-readiness-mapper";

export function mapLaunchMode(v4: CompanyCommandCenterV4Payload): LaunchModeView {
  const rs = v4.v3.shared.rolloutSummary;
  const readiness = deriveLaunchReadiness(v4.v3.shared.overallStatus, rs);

  const blockers: string[] = [];
  for (const b of rs.blockedSystems) blockers.push(`Blocked rollout context: ${b}`);
  if (v4.v3.shared.systems?.ranking.readinessGatesOk != null && v4.v3.shared.systems.ranking.readinessGatesTotal != null) {
    const ok = v4.v3.shared.systems.ranking.readinessGatesOk;
    const tot = v4.v3.shared.systems.ranking.readinessGatesTotal;
    if (ok < tot) blockers.push(`Ranking gates incomplete (${ok}/${tot})`);
  }

  const readinessChecklist: Record<string, boolean> = {
    executivePostureOk: v4.v3.shared.overallStatus === "healthy" || v4.v3.shared.overallStatus === "limited",
    noBlockedRollouts: rs.blockedSystems.length === 0,
    rankingRollbackClear: !(v4.v3.shared.systems?.ranking.rollbackAny ?? false),
    digestClearOfCritical: v4.anomalyDigest.countsBySeverity.critical === 0,
  };

  const rolloutStates = [
    { label: "Primary", detail: rs.primarySystems.length ? rs.primarySystems.join(", ") : "—" },
    { label: "Shadow", detail: rs.shadowSystems.length ? rs.shadowSystems.join(", ") : "—" },
    { label: "Influence", detail: rs.influenceSystems.length ? rs.influenceSystems.join(", ") : "—" },
    { label: "Blocked", detail: rs.blockedSystems.length ? rs.blockedSystems.join(", ") : "—" },
  ];

  const recommendedGoNoGoNotes: string[] = [];
  if (readiness === "go") recommendedGoNoGoNotes.push("Signals allow proceeding with planned rollouts — still verify subsystem owners.");
  if (readiness === "caution") recommendedGoNoGoNotes.push("Mixed signals: resolve warnings and blocked contexts before widening scope.");
  if (readiness === "hold") recommendedGoNoGoNotes.push("Hold or narrow scope until blocked rollbacks and critical digest items are cleared.");

  const supportive = v4.briefing.cards.filter((c) => c.severity === "info").slice(0, 2).map((c) => c.summary);
  recommendedGoNoGoNotes.push(...supportive);

  return {
    mode: "launch",
    launchReadiness: readiness,
    blockers: blockers.length ? blockers : ["—"],
    readinessChecklist,
    rolloutStates,
    recommendedGoNoGoNotes: recommendedGoNoGoNotes.slice(0, 8),
    warnings: v4.v3.roles.founder.warnings.slice(0, 10),
  };
}
