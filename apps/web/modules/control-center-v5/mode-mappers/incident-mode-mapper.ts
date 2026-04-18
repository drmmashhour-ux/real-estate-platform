import type { CompanyCommandCenterV4Payload } from "@/modules/control-center-v4/company-command-center-v4.types";
import type { IncidentModeView } from "../company-command-center-v5.types";
import { keySystemsNeedingAttention, topDigestSeverity } from "../company-command-center-v5-extraction";
import { maxDigestToIncident } from "../control-center-v5-severity-mapper";

export function mapIncidentMode(v4: CompanyCommandCenterV4Payload): IncidentModeView {
  const s = v4.v3.shared.systems;
  const dm = topDigestSeverity(v4);
  const severity = maxDigestToIncident(v4.v3.shared.overallStatus, dm);

  const affectedSystems = keySystemsNeedingAttention(v4).map((k) => k.label);
  const criticalWarnings = [
    ...v4.v3.roles.founder.warnings,
    ...v4.anomalyDigest.items.filter((i) => i.severity === "critical").map((i) => `${i.system}: ${i.title}`),
  ].slice(0, 12);

  const rollbackSignals: string[] = [];
  if (s?.ranking.rollbackAny) rollbackSignals.push("Ranking rollback flag is on");
  if (s?.ranking.recommendation) rollbackSignals.push(s.ranking.recommendation);

  const stabilityIndicators: Record<string, string | number | null> = {};
  if (s) {
    stabilityIndicators.brainFallbackPct = s.brain.fallbackRatePct;
    stabilityIndicators.adsPctRisky = s.ads.pctRunsRisky;
    stabilityIndicators.fusionConflicts = s.fusion.conflictCount;
    stabilityIndicators.swarmConflicts = s.swarm.conflictCount;
    stabilityIndicators.platformOverdue = s.platformCore.overdueSchedules;
  }

  const recommendedAttentionAreas: string[] = [];
  for (const it of v4.anomalyDigest.items.filter((i) => i.severity === "warning" || i.severity === "critical").slice(0, 6)) {
    recommendedAttentionAreas.push(`${it.system}: ${it.summary.slice(0, 120)}`);
  }
  if (!recommendedAttentionAreas.length && affectedSystems.length) {
    recommendedAttentionAreas.push(`Review flagged systems: ${affectedSystems.slice(0, 4).join(", ")}`);
  }

  const incidentSummary = [
    `Incident posture derived from executive ${v4.v3.shared.overallStatus} and digest signals.`,
    affectedSystems.length ? `Systems over threshold: ${affectedSystems.length}.` : "No subsystem flagged limited/warning/critical in snapshot.",
  ].join(" ");

  return {
    mode: "incident",
    severity,
    incidentSummary,
    affectedSystems: affectedSystems.length ? affectedSystems : ["—"],
    criticalWarnings: criticalWarnings.length ? criticalWarnings.slice(0, 12) : ["—"],
    rollbackSignals: rollbackSignals.length ? rollbackSignals : ["—"],
    stabilityIndicators,
    recommendedAttentionAreas: recommendedAttentionAreas.slice(0, 10),
  };
}
