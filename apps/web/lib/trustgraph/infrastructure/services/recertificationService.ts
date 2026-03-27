import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase8PlatformConfig } from "@/lib/trustgraph/config/phase8-platform";
import type { RecertificationOutcome } from "@/lib/trustgraph/domain/recertification";
import { isTrustGraphRecertificationEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function scheduleRecertificationJob(args: {
  subjectType: string;
  subjectId: string;
  workspaceId: string | null;
}): Promise<{ jobId: string } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphRecertificationEnabled()) return { skipped: true };

  const cfg = getPhase8PlatformConfig();
  const next = new Date();
  next.setDate(next.getDate() + cfg.recertification.defaultListingIntervalDays);

  const job = await prisma.trustgraphRecertificationJob.create({
    data: {
      subjectType: args.subjectType,
      subjectId: args.subjectId,
      workspaceId: args.workspaceId ?? undefined,
      status: "pending",
      nextRunAt: next,
    },
    select: { id: true },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_recertification_scheduled",
    sourceModule: "trustgraph",
    entityType: "RECERTIFICATION_JOB",
    entityId: job.id,
    payload: { subjectType: args.subjectType, subjectId: args.subjectId },
  }).catch(() => {});

  return { jobId: job.id };
}

export async function executeRecertificationJob(jobId: string): Promise<{ outcome: RecertificationOutcome } | { skipped: true }> {
  if (!isTrustGraphEnabled() || !isTrustGraphRecertificationEnabled()) return { skipped: true };

  const job = await prisma.trustgraphRecertificationJob.findUnique({ where: { id: jobId } });
  if (!job) return { skipped: true };

  let outcome: RecertificationOutcome = "still_valid";
  if (job.subjectType === "LISTING") {
    const c = await prisma.verificationCase.findFirst({
      where: { entityType: "LISTING", entityId: job.subjectId },
      orderBy: { updatedAt: "desc" },
      select: { readinessLevel: true, updatedAt: true },
    });
    if (!c) outcome = "needs_update";
    else if (c.readinessLevel === "action_required") outcome = "high_risk";
    else if (Date.now() - c.updatedAt.getTime() > 365 * 86400000) outcome = "expired";
  }

  await prisma.trustgraphRecertificationJob.update({
    where: { id: jobId },
    data: { status: "completed", lastResult: outcome },
  });
  await prisma.trustgraphRecertificationEvent.create({
    data: {
      jobId,
      eventType: "check_completed",
      payload: { outcome } as object,
    },
  });

  void recordPlatformEvent({
    eventType: "trustgraph_recertification_run",
    sourceModule: "trustgraph",
    entityType: "RECERTIFICATION_JOB",
    entityId: jobId,
    payload: { outcome },
  }).catch(() => {});

  return { outcome };
}
