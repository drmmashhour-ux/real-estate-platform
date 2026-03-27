import { prisma } from "@/lib/db";
import { isTrustGraphRecertificationEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

/** Returns jobs due before `before` (for cron / worker). */
export async function listDueRecertificationJobs(before: Date, limit: number): Promise<string[]> {
  if (!isTrustGraphEnabled() || !isTrustGraphRecertificationEnabled()) return [];
  const rows = await prisma.trustgraphRecertificationJob.findMany({
    where: { status: "pending", nextRunAt: { lte: before } },
    take: limit,
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
