import { prisma } from "@/lib/db";
import type { AiMetricsSlice } from "./types";

export async function collectAiMetrics(start: Date, end: Date): Promise<AiMetricsSlice> {
  const [recRows, recByStatus, apprPending, apprApproved, apprRejected] = await Promise.all([
    prisma.managerAiRecommendation.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.managerAiRecommendation.groupBy({
      by: ["status"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { _all: true },
    }),
    prisma.managerAiApprovalRequest.count({
      where: { createdAt: { gte: start, lte: end }, status: "pending" },
    }),
    prisma.managerAiApprovalRequest.count({
      where: {
        createdAt: { gte: start, lte: end },
        status: "approved",
      },
    }),
    prisma.managerAiApprovalRequest.count({
      where: { createdAt: { gte: start, lte: end }, status: "rejected" },
    }),
  ]);

  const recommendationsByStatus: Record<string, number> = {};
  for (const row of recByStatus) {
    recommendationsByStatus[row.status] = row._count._all;
  }

  return {
    recommendationsCreated: recRows,
    recommendationsByStatus,
    approvalPending: apprPending,
    approvalApproved: apprApproved,
    approvalRejected: apprRejected,
  };
}
