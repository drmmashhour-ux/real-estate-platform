import type { CompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.types";
import type { CommandCenterRolePriority, CommandCenterRoleView } from "../company-command-center-v3.types";
import { capPriorities, stringsToPriorities } from "../control-center-v3-priority-mapper";
import { extractGovernanceRiskStrings, systemsNeedingAttentionLabels } from "../company-command-center-v3-extraction";

function governanceHighlights(v2: CompanyCommandCenterV2Payload) {
  const s = v2.v1.systems;
  const rows = [
    { id: "brain", label: "Brain V8", status: s.brain.status, oneLiner: s.brain.topIssue ?? s.brain.summary.slice(0, 120) },
    { id: "ranking", label: "Ranking V8", status: s.ranking.status, oneLiner: s.ranking.recommendation ?? s.ranking.summary.slice(0, 120) },
    { id: "fusion", label: "Fusion", status: s.fusion.status, oneLiner: s.fusion.healthNote ?? s.fusion.summary.slice(0, 120) },
    { id: "swarm", label: "Swarm", status: s.swarm.status, oneLiner: s.swarm.negotiationNote ?? s.swarm.summary.slice(0, 120) },
  ];
  return rows;
}

export function mapRiskGovernanceRole(v2: CompanyCommandCenterV2Payload): CommandCenterRoleView {
  const s = v2.v1.systems;
  const riskStrings = extractGovernanceRiskStrings(v2);
  const extraRisks: string[] = [];
  if (s.ranking.warningsCount != null && s.ranking.warningsCount > 0) {
    extraRisks.push(`${s.ranking.warningsCount} ranking warning(s)`);
  }
  if (s.brain.warningCount > 0) {
    extraRisks.push(`${s.brain.warningCount} brain warning(s)`);
  }

  const allRiskLabels = [...riskStrings, ...extraRisks];
  const topRisks = capPriorities(
    stringsToPriorities(
      allRiskLabels.map((_, i) => `gov-r-${i}`),
      allRiskLabels,
    ),
    8,
  );

  const blocked = v2.v1.rolloutSummary.blockedSystems;
  const blockers: CommandCenterRolePriority[] = [];
  if (blocked.length) {
    blockers.push({
      id: "blocked-rollouts",
      label: `Blocked rollouts involve: ${blocked.join(", ")}`,
      rationale: null,
    });
  }
  if (s.ranking.rollbackAny) {
    blockers.push({ id: "ranking-rollback", label: "Ranking rollback signal — review governance gates", rationale: null });
  }

  const priLabels: string[] = [];
  if (s.brain.fallbackRatePct != null) {
    priLabels.push(`Monitor brain fallback rate (${s.brain.fallbackRatePct.toFixed(1)}%)`);
  }
  if (s.fusion.conflictCount != null && s.fusion.conflictCount > 0) {
    priLabels.push(`Resolve or triage ${s.fusion.conflictCount} fusion conflict(s)`);
  }

  const heroSummary = [
    `Governance scan: ranking rollback flag ${s.ranking.rollbackAny ? "on" : "off"}.`,
    `Brain fallback ${s.brain.fallbackRatePct != null ? `${s.brain.fallbackRatePct.toFixed(1)}%` : "n/a"}; fusion conflicts ${s.fusion.conflictCount ?? "n/a"}.`,
  ].join(" ");

  const attention = systemsNeedingAttentionLabels(v2);

  return {
    role: "risk_governance",
    heroSummary,
    topPriorities: capPriorities(
      stringsToPriorities(
        priLabels.map((_, i) => `gov-p-${i}`),
        priLabels,
      ),
      5,
    ),
    topRisks,
    topBlockers: capPriorities(blockers, 6),
    recommendedFocusAreas: attention.map((a) => `Validate ${a} before widening rollouts`).slice(0, 6),
    systems: { highlights: governanceHighlights(v2) },
    rolloutSummary: v2.v1.rolloutSummary,
    warnings: [...v2.v1.executiveSummary.criticalWarnings, ...riskStrings].slice(0, 14),
  };
}
