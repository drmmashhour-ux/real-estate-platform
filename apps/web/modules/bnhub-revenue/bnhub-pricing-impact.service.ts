/**
 * Pricing execution intelligence — reads `BnhubPricingExecutionLog` only (success rows for averages).
 */

import { prisma } from "@/lib/db";
import { round2 } from "./bnhub-revenue-math";

export async function getPricingImpactSummary(hostUserId: string): Promise<PricingImpactSummary> {
  const executions = await prisma.bnhubPricingExecutionLog.findMany({
    where: {
      listing: { ownerId: hostUserId },
      status: "success",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { listing: { select: { title: true } } },
  });

  const appliedCount = executions.length;
  const avgDelta = appliedCount
    ? executions.reduce((sum, row) => sum + (Number(row.newPrice) - Number(row.oldPrice)), 0) / appliedCount
    : 0;

  return {
    appliedCount,
    avgDelta: round2(avgDelta),
    latestExecutions: executions.slice(0, 20),
  };
}
