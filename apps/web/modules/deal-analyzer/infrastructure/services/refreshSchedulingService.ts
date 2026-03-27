import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RefreshJobStatus } from "@/modules/deal-analyzer/domain/refresh";

export async function createRefreshJob(args: {
  propertyId: string;
  analysisId: string | null;
  refreshType: string;
  triggerSource: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
}) {
  return prisma.dealAnalysisRefreshJob.create({
    data: {
      propertyId: args.propertyId,
      analysisId: args.analysisId,
      refreshType: args.refreshType,
      status: RefreshJobStatus.PENDING,
      scheduledAt: args.scheduledAt ?? new Date(),
      triggerSource: args.triggerSource,
      metadata: args.metadata != null ? (args.metadata as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function markJobRunning(jobId: string) {
  return prisma.dealAnalysisRefreshJob.update({
    where: { id: jobId },
    data: { status: RefreshJobStatus.RUNNING, startedAt: new Date() },
  });
}

export async function markJobCompleted(jobId: string) {
  return prisma.dealAnalysisRefreshJob.update({
    where: { id: jobId },
    data: { status: RefreshJobStatus.COMPLETED, completedAt: new Date() },
  });
}

export async function markJobFailed(jobId: string) {
  return prisma.dealAnalysisRefreshJob.update({
    where: { id: jobId },
    data: { status: RefreshJobStatus.FAILED, completedAt: new Date() },
  });
}

export async function markJobSkipped(jobId: string, reason: string) {
  return prisma.dealAnalysisRefreshJob.update({
    where: { id: jobId },
    data: {
      status: RefreshJobStatus.SKIPPED,
      completedAt: new Date(),
      metadata: { skipReason: reason },
    },
  });
}
