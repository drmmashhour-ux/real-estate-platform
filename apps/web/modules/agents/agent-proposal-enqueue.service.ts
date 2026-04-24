import { prisma } from "@/lib/db";
import type { ProposedAction } from "@/modules/agents/agent.types";
import { COORDINATION_ORCHESTRATOR_VERSION } from "@/modules/agents/agent.types";
import {
  EXECUTIVE_AGENT_SCHEMA_VERSION,
  EXECUTIVE_POLICY_VERSION,
} from "@/modules/agents/executive-versions";

/**
 * Persists proposals as `ExecutiveTask` rows — never mutates listings, deals, or messages directly.
 */
export async function enqueueCoordinationProposals(input: {
  entityType: string;
  entityId: string;
  ownerUserId: string;
  actions: ProposedAction[];
  /** When true, tasks are flagged HIGH priority (still human-gated). */
  elevatedPriority: boolean;
}): Promise<string[]> {
  const ids: string[] = [];
  for (const a of input.actions) {
    const row = await prisma.executiveTask.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        originatingAgent: a.agentType,
        assignedAgent: a.agentType,
        taskType: "COORDINATION_PROPOSAL",
        status: "OPEN",
        priority: input.elevatedPriority ? "HIGH" : "MEDIUM",
        title: `[${a.agentType}] ${a.kind}`.slice(0, 500),
        summary: a.reasoning.slice(0, 2000),
        recommendationJson: { coordinationProposal: a, version: COORDINATION_ORCHESTRATOR_VERSION } as object,
        requiresHumanApproval: true,
        ownerUserId: input.ownerUserId,
        orchestratorVersion: COORDINATION_ORCHESTRATOR_VERSION,
        agentSchemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
        policyVersion: EXECUTIVE_POLICY_VERSION,
      },
    });
    ids.push(row.id);
  }
  return ids;
}
