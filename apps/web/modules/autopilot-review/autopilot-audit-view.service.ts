import { prisma } from "@/lib/db";

export async function listRecentAutopilotAuditRows(take = 80) {
  return prisma.lecipmFullAutopilotExecution.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(take, 200),
    select: {
      id: true,
      domain: true,
      actionType: true,
      sourceSystem: true,
      decisionOutcome: true,
      policyRuleId: true,
      riskLevel: true,
      confidence: true,
      explanation: true,
      createdAt: true,
      rolledBackAt: true,
      platformActionId: true,
    },
  });
}
