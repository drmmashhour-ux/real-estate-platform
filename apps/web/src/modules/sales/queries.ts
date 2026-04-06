import { prisma } from "@/lib/db";

export async function getSalesAgentByUserId(userId: string) {
  return prisma.salesAgent.findFirst({
    where: { userId, active: true },
    include: {
      performance: true,
      assignments: {
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              score: true,
              priorityScore: true,
              pipelineStatus: true,
              pipelineStage: true,
              nextBestAction: true,
              nextFollowUpAt: true,
              nextActionAt: true,
              platformConversationId: true,
              executionStage: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: { lead: { priorityScore: "desc" } },
      },
    },
  });
}

export async function listSalesAgentsWithStats() {
  return prisma.salesAgent.findMany({
    orderBy: [{ active: "desc" }, { priority: "desc" }, { createdAt: "asc" }],
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      performance: true,
      _count: { select: { assignments: true } },
    },
  });
}

export async function listRecentAssignments(take = 50) {
  return prisma.salesAssignment.findMany({
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      agent: { include: { user: { select: { email: true, name: true } } } },
      lead: { select: { id: true, name: true, email: true, pipelineStatus: true, priorityScore: true } },
    },
  });
}
