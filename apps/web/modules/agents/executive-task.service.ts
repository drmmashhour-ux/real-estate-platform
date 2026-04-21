import { prisma } from "@/lib/db";
import type { AgentOutput } from "./executive.types";
import {
  EXECUTIVE_AGENT_SCHEMA_VERSION,
  EXECUTIVE_ORCHESTRATOR_VERSION,
  EXECUTIVE_POLICY_VERSION,
} from "./executive-versions";
import { executiveLog } from "./executive-log";

export async function persistTasksFromAgentOutputs(params: {
  entityType: string;
  entityId: string;
  outputs: AgentOutput[];
  ownerUserId: string;
}): Promise<Array<{ taskId: string; title: string }>> {
  const created: Array<{ taskId: string; title: string }> = [];

  for (const o of params.outputs) {
    if (!o.requiresEscalation && o.blockers.length === 0 && o.risks.length === 0) continue;

    const exists = await prisma.executiveTask.findFirst({
      where: {
        entityType: params.entityType,
        entityId: params.entityId,
        title: o.headline.slice(0, 500),
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_APPROVAL"] },
      },
    });
    if (exists) continue;

    const row = await prisma.executiveTask.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        originatingAgent: o.agentName,
        assignedAgent: o.agentName,
        taskType: "RECOMMEND",
        status: o.requiresEscalation ? "WAITING_APPROVAL" : "OPEN",
        priority: o.requiresEscalation ? "HIGH" : "MEDIUM",
        title: o.headline.slice(0, 500),
        summary: [...o.recommendations, ...o.blockers].slice(0, 12).join("\n"),
        recommendationJson: { recommendations: o.recommendations } as object,
        blockersJson: { blockers: o.blockers, risks: o.risks } as object,
        requiresHumanApproval: true,
        ownerUserId: params.ownerUserId,
        orchestratorVersion: EXECUTIVE_ORCHESTRATOR_VERSION,
        agentSchemaVersion: EXECUTIVE_AGENT_SCHEMA_VERSION,
        policyVersion: EXECUTIVE_POLICY_VERSION,
      },
    });
    created.push({ taskId: row.id, title: row.title });
    executiveLog.task("created_from_agent", { agent: o.agentName, taskId: row.id });
  }

  return created;
}

export async function listExecutiveTasks(ownerUserId: string, opts?: { status?: string }) {
  const where =
    opts?.status ?
      { ownerUserId, status: opts.status }
    : { ownerUserId };

  return prisma.executiveTask.findMany({
    where,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
}
