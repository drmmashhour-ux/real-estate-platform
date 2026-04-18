import { prisma } from "@/lib/db";
import { brokerWorkspaceAuditKeys, logBrokerWorkspaceEvent } from "@/lib/broker/broker-workspace-audit";
import type { RebalanceSuggestion } from "./workload.types";

/**
 * Heuristic suggestions only — broker must confirm reassignment in product workflows.
 */
export async function suggestRebalance(ownerBrokerId: string): Promise<RebalanceSuggestion[]> {
  const team = await prisma.brokerTeam.findFirst({
    where: { ownerBrokerId },
    include: { members: { where: { status: "active" } } },
  });
  if (!team || team.members.length === 0) return [];

  const suggestions: RebalanceSuggestion[] = [];
  for (const m of team.members) {
    const load = await prisma.brokerDealAssignment.count({
      where: { assignedToUserId: m.userId, status: "active" },
    });
    if (load > 12) {
      suggestions.push({
        type: "overload",
        title: "Member has many active deal roles",
        summary: `User has ${load} active assignments.`,
        priority: "medium",
        reasons: ["High concurrent assignment count"],
        recommendedAction: "Consider redistributing coordinator or reviewer roles.",
        suggestedAssigneeUserId: ownerBrokerId,
      });
    }
  }

  if (suggestions.length > 0) {
    await logBrokerWorkspaceEvent({
      actorUserId: ownerBrokerId,
      actionKey: brokerWorkspaceAuditKeys.reassignmentSuggested,
      teamId: team.id,
      payload: { count: suggestions.length },
    });
  }

  return suggestions;
}
