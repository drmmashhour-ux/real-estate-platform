import type { CompanyCommandCenterV2Payload } from "@/modules/control-center-v2/company-command-center-v2.types";
import type { CommandCenterRoleView } from "../company-command-center-v3.types";
import { capPriorities, stringsToPriorities } from "../control-center-v3-priority-mapper";
import { extractOperationalBlockers } from "../company-command-center-v3-extraction";

function opsHighlights(v2: CompanyCommandCenterV2Payload) {
  const s = v2.v1.systems;
  return [
    {
      id: "operator",
      label: "Operator V2",
      status: s.operator.status,
      oneLiner: s.operator.summary.slice(0, 140),
    },
    {
      id: "platform",
      label: "Platform Core",
      status: s.platformCore.status,
      oneLiner: s.platformCore.summary.slice(0, 140),
    },
    {
      id: "swarm",
      label: "Swarm",
      status: s.swarm.status,
      oneLiner: s.swarm.summary.slice(0, 140),
    },
  ];
}

export function mapOperationsRole(v2: CompanyCommandCenterV2Payload): CommandCenterRoleView {
  const s = v2.v1.systems;
  const op = s.operator;
  const pc = s.platformCore;

  const priorityLabels: string[] = [];
  if (op.topRecommendation) priorityLabels.push(`Operator: ${op.topRecommendation}`);
  if ((pc.overdueSchedules ?? 0) > 0) priorityLabels.push(`Clear ${pc.overdueSchedules} overdue schedule(s)`);
  if ((pc.blockedDependencyEdges ?? 0) > 0) priorityLabels.push(`Review ${pc.blockedDependencyEdges} blocked dependency edge(s)`);

  const topPriorities = capPriorities(
    stringsToPriorities(
      priorityLabels.map((_, i) => `op-p-${i}`),
      priorityLabels,
    ),
    5,
  );

  const riskLabels: string[] = [];
  if ((op.conflictCount ?? 0) > 0) riskLabels.push(`${op.conflictCount} operator conflicts`);
  if ((s.swarm.conflictCount ?? 0) > 0) riskLabels.push(`${s.swarm.conflictCount} swarm conflicts`);
  if (pc.healthWarnings.length) riskLabels.push(...pc.healthWarnings.slice(0, 3));

  const topRisks = capPriorities(
    stringsToPriorities(
      riskLabels.map((_, i) => `op-r-${i}`),
      riskLabels,
    ),
    6,
  );

  const heroSummary = [
    `Execution: Operator (${op.status}), Platform Core (${pc.status}), Swarm (${s.swarm.status}).`,
    op.planCount != null ? `Operator plans tracked: ${op.planCount}.` : "",
    pc.pendingDecisions != null ? `Pending decisions: ${pc.pendingDecisions}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const focus = [
    op.executionPlanFlag ? "Execution plan flag on" : null,
    op.simulationFlag ? "Simulation preview available" : null,
    pc.schedulerEnabled ? "Scheduler enabled" : null,
  ].filter(Boolean) as string[];

  return {
    role: "operations",
    heroSummary,
    topPriorities,
    topRisks,
    topBlockers: extractOperationalBlockers(v2),
    recommendedFocusAreas: focus.slice(0, 6),
    systems: { highlights: opsHighlights(v2) },
    rolloutSummary: v2.v1.rolloutSummary,
    warnings: [...pc.healthWarnings, ...(op.conflictCount && op.conflictCount > 0 ? [`${op.conflictCount} operator conflicts`] : [])].slice(
      0,
      12,
    ),
  };
}
