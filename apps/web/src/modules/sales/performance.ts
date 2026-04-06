import { prisma } from "@/lib/db";
import type { AssignmentStatus } from "./constants";
import { ASSIGNMENT_STATUS, DEFAULT_COMMISSION_RATE_ON_DEAL } from "./constants";

function dealDollars(lead: {
  finalSalePrice: number | null;
  dealValue: number | null;
  finalCommission: number | null;
  commissionEstimate: number | null;
}): { revenue: number; commission: number } {
  const revenue = lead.finalSalePrice ?? lead.dealValue ?? 0;
  const commission =
    lead.finalCommission ??
    lead.commissionEstimate ??
    Math.round(revenue * DEFAULT_COMMISSION_RATE_ON_DEAL);
  return { revenue: Number(revenue), commission: Number(commission) };
}

export async function updateAssignmentStatus(
  leadId: string,
  agentUserId: string,
  status: AssignmentStatus
) {
  if (!ASSIGNMENT_STATUS.includes(status)) throw new Error("Invalid status");

  const agent = await prisma.salesAgent.findUnique({ where: { userId: agentUserId } });
  if (!agent) throw new Error("Not a sales agent");

  const assignment = await prisma.salesAssignment.findUnique({
    where: { leadId },
    include: { lead: true },
  });
  if (!assignment || assignment.agentId !== agent.id) throw new Error("Assignment not found");

  const wasClosed = assignment.status === "closed";

  return prisma.$transaction(async (tx) => {
    await tx.salesAssignment.update({
      where: { id: assignment.id },
      data: { status },
    });

    const touch: Record<string, unknown> = {};
    if (status === "contacted") {
      touch.lastContactedAt = new Date();
      touch.lastContactAt = new Date();
    }
    if (Object.keys(touch).length) {
      await tx.lead.update({ where: { id: leadId }, data: touch as object });
    }

    if (status === "closed" && !wasClosed) {
      const { revenue, commission } = dealDollars(assignment.lead);
      await tx.salesPerformance.upsert({
        where: { agentId: agent.id },
        create: {
          agentId: agent.id,
          dealsClosed: 1,
          revenue,
          commission,
        },
        update: {
          dealsClosed: { increment: 1 },
          revenue: { increment: revenue },
          commission: { increment: commission },
        },
      });
    }

    return tx.salesAssignment.findUniqueOrThrow({
      where: { id: assignment.id },
      include: { lead: { select: { id: true, name: true, pipelineStatus: true } } },
    });
  });
}

/** Recompute rollup from assignments + leads (repair drift). */
export async function refreshAgentPerformance(agentId: string) {
  const assignments = await prisma.salesAssignment.findMany({
    where: { agentId },
    include: { lead: true },
  });

  let leadsAssigned = 0;
  let dealsClosed = 0;
  let revenue = 0;
  let commission = 0;

  for (const a of assignments) {
    if (a.status !== "lost") leadsAssigned += 1;
    if (a.status === "closed") {
      dealsClosed += 1;
      const d = dealDollars(a.lead);
      revenue += d.revenue;
      commission += d.commission;
    }
  }

  return prisma.salesPerformance.upsert({
    where: { agentId },
    create: { agentId, leadsAssigned, dealsClosed, revenue, commission },
    update: { leadsAssigned, dealsClosed, revenue, commission },
  });
}

export async function getSalesLeaderboard(take = 20) {
  return prisma.salesPerformance.findMany({
    orderBy: [{ dealsClosed: "desc" }, { revenue: "desc" }],
    take,
    include: {
      agent: {
        include: { user: { select: { id: true, email: true, name: true } } },
      },
    },
  });
}

export function assignmentConversionRate(assigned: number, closed: number): number {
  if (assigned <= 0) return 0;
  return closed / assigned;
}
