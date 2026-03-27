import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RefreshEventType } from "@/modules/deal-analyzer/domain/refresh";

export async function recordRefreshEvent(args: {
  propertyId: string;
  analysisId: string | null;
  eventType: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  confidenceDelta?: number | null;
}) {
  return prisma.dealAnalysisRefreshEvent.create({
    data: {
      propertyId: args.propertyId,
      analysisId: args.analysisId,
      eventType: args.eventType,
      previousState: args.previousState as Prisma.InputJsonValue | undefined,
      newState: args.newState as Prisma.InputJsonValue | undefined,
      confidenceDelta: args.confidenceDelta ?? undefined,
    },
  });
}

export async function getLatestRefreshEvent(propertyId: string) {
  return prisma.dealAnalysisRefreshEvent.findFirst({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPendingJobsForProperty(propertyId: string) {
  return prisma.dealAnalysisRefreshJob.findMany({
    where: { propertyId, status: "pending" },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });
}
