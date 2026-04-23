import { prisma } from "@/lib/db";

export type AutopilotHeadlineMetrics = {
  since: string;
  totalExecutions: number;
  allowCount: number;
  requireApprovalCount: number;
  blockCount: number;
  successRate: number;
  failureRate: number;
  rollbackCount: number;
  /** Heuristic: count of auto-executed rows. */
  autoExecutedCount: number;
};

export type AutopilotOperatorWidgets = {
  rollbacksToday: number;
  /** Rough proxy: auto lanes × 2 minutes saved per action (tune with real telemetry). */
  estimatedMinutesSaved7d: number;
  /** Advisory — rows with outcome linkage populated. */
  outcomeLinkedExecutions7d: number;
};

export async function getAutopilotOperatorWidgets(since7d: Date, startOfToday: Date): Promise<AutopilotOperatorWidgets> {
  const [rollbacksToday, autoLike, linked] = await Promise.all([
    prisma.lecipmFullAutopilotExecution.count({
      where: { rolledBackAt: { gte: startOfToday } },
    }),
    prisma.lecipmFullAutopilotExecution.count({
      where: {
        createdAt: { gte: since7d },
        decisionOutcome: "ALLOW_AUTOMATIC",
      },
    }),
    prisma.lecipmFullAutopilotExecution.count({
      where: {
        createdAt: { gte: since7d },
        outcomeDeltaJson: { not: null },
      },
    }),
  ]);

  return {
    rollbacksToday,
    estimatedMinutesSaved7d: autoLike * 2,
    outcomeLinkedExecutions7d: linked,
  };
}

export async function getAutopilotHeadlineMetrics(
  since: Date = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  })()
): Promise<AutopilotHeadlineMetrics> {
  const rows = await prisma.lecipmFullAutopilotExecution.findMany({
    where: { createdAt: { gte: since } },
    select: { decisionOutcome: true, rolledBackAt: true, platformActionId: true },
  });

  const n = rows.length;
  const allow = rows.filter((r) => r.decisionOutcome === "ALLOW_AUTOMATIC").length;
  const need = rows.filter((r) => r.decisionOutcome === "REQUIRE_APPROVAL").length;
  const block = rows.filter((r) => r.decisionOutcome === "BLOCK").length;
  const roll = rows.filter((r) => r.rolledBackAt).length;
  const auto = allow; // auto path uses allow bucket in v1

  return {
    since: since.toISOString(),
    totalExecutions: n,
    allowCount: allow,
    requireApprovalCount: need,
    blockCount: block,
    successRate: n === 0 ? 0 : (auto + need) / n,
    failureRate: n === 0 ? 0 : block / n,
    rollbackCount: roll,
    autoExecutedCount: auto,
  };
}
