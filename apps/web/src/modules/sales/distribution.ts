import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { DistributionMode } from "./constants";

async function assignmentCountWhere(
  agentId: string,
  extra: Prisma.SalesAssignmentWhereInput = {}
): Promise<number> {
  return prisma.salesAssignment.count({
    where: { agentId, ...extra },
  });
}

/**
 * Pick next agent: **round_robin** = lowest active load (open assignments);
 * **priority** = highest `priority` first, then lowest load.
 */
export async function pickNextAgentId(mode: DistributionMode = "round_robin"): Promise<string | null> {
  const agents = await prisma.salesAgent.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  if (agents.length === 0) return null;

  const withLoad = await Promise.all(
    agents.map(async (a) => ({
      agent: a,
      load: await assignmentCountWhere(a.id, { status: { in: ["assigned", "contacted"] } }),
    }))
  );

  if (mode === "priority") {
    withLoad.sort((x, y) => {
      if (y.agent.priority !== x.agent.priority) return y.agent.priority - x.agent.priority;
      return x.load - y.load;
    });
  } else {
    withLoad.sort((x, y) => x.load - y.load || x.agent.id.localeCompare(y.agent.id));
  }

  return withLoad[0]?.agent.id ?? null;
}

async function ensurePerformanceRow(agentId: string, tx: Prisma.TransactionClient) {
  await tx.salesPerformance.upsert({
    where: { agentId },
    create: { agentId },
    update: {},
  });
}

/**
 * Assign a CRM `Lead` to a sales agent (updates `introducedByBrokerId` / `lastFollowUpByBrokerId` for Close Room visibility).
 */
export async function assignLeadToAgent(leadId: string, mode: DistributionMode = "round_robin") {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const agentId = await pickNextAgentId(mode);
  if (!agentId) throw new Error("No active sales agents");

  const agent = await prisma.salesAgent.findUniqueOrThrow({
    where: { id: agentId },
    select: { id: true, userId: true },
  });

  return prisma.$transaction(async (tx) => {
    await ensurePerformanceRow(agentId, tx);

    const prior = await tx.salesAssignment.findUnique({ where: { leadId } });

    const row = await tx.salesAssignment.upsert({
      where: { leadId },
      create: {
        agentId,
        leadId,
        userId: lead.userId ?? undefined,
        status: "assigned",
      },
      update: {
        agentId,
        userId: lead.userId ?? undefined,
        status: "assigned",
      },
    });

    if (!prior) {
      await tx.salesPerformance.update({
        where: { agentId },
        data: { leadsAssigned: { increment: 1 } },
      });
    } else if (prior.agentId !== agentId) {
      await ensurePerformanceRow(prior.agentId, tx);
      await tx.salesPerformance.update({
        where: { agentId: prior.agentId },
        data: { leadsAssigned: { decrement: 1 } },
      });
      await tx.salesPerformance.update({
        where: { agentId },
        data: { leadsAssigned: { increment: 1 } },
      });
    }

    await tx.lead.update({
      where: { id: leadId },
      data: {
        introducedByBrokerId: agent.userId,
        lastFollowUpByBrokerId: agent.userId,
      },
    });

    return row;
  });
}

/** Auto-assign leads that have no `SalesAssignment` yet (priority users first). */
export async function assignUnassignedLeads(limit = 25, mode: DistributionMode = "round_robin") {
  const unassigned = await prisma.lead.findMany({
    where: {
      salesAssignment: { is: null },
      pipelineStatus: { notIn: ["won", "lost"] },
    },
    orderBy: [{ priorityScore: "desc" }, { createdAt: "asc" }],
    take: limit,
    select: { id: true },
  });

  const results: { leadId: string; ok: boolean; error?: string }[] = [];
  for (const l of unassigned) {
    try {
      await assignLeadToAgent(l.id, mode);
      results.push({ leadId: l.id, ok: true });
    } catch (e) {
      results.push({
        leadId: l.id,
        ok: false,
        error: e instanceof Error ? e.message : "assign failed",
      });
    }
  }
  return results;
}
