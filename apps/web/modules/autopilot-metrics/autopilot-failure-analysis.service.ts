import { prisma } from "@/lib/db";

export async function analyzeAutopilotFailures(since: Date) {
  const blocked = await prisma.lecipmFullAutopilotExecution.findMany({
    where: {
      decisionOutcome: "BLOCK",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      domain: true,
      actionType: true,
      policyRuleId: true,
      explanation: true,
      createdAt: true,
    },
  });

  const grouped = new Map<string, number>();
  for (const r of blocked) {
    const k = `${r.domain}:${r.policyRuleId}`;
    grouped.set(k, (grouped.get(k) ?? 0) + 1);
  }

  const topBlockedReasons = [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key, count]) => ({ key, count }));

  return {
    blockedSampleSize: blocked.length,
    topBlockedReasons,
  };
}
