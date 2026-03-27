import { prisma } from "@/lib/db";
import type { RecertificationStatusDto } from "@/lib/trustgraph/domain/recertification";

export async function getRecertificationStatus(jobId: string): Promise<RecertificationStatusDto | null> {
  const j = await prisma.trustgraphRecertificationJob.findUnique({
    where: { id: jobId },
  });
  if (!j) return null;
  return {
    jobId: j.id,
    subjectType: j.subjectType,
    subjectId: j.subjectId,
    status: j.status,
    nextRunAt: j.nextRunAt?.toISOString() ?? null,
    lastResult: j.lastResult,
  };
}
