import { prisma } from "@/lib/db";

export async function buildDailyAutopilotSummary() {
  const [recommended, pending, executed] = await Promise.all([
    prisma.platformAutopilotAction.count({ where: { status: "recommended" } }),
    prisma.platformAutopilotAction.count({ where: { status: "pending_approval" } }),
    prisma.platformAutopilotAction.count({ where: { status: "executed" } }),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    counts: { recommended, pending, executed },
    topActions: await prisma.platformAutopilotAction.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, domain: true, riskLevel: true, status: true },
    }),
  };
}
