import type { ComplaintStatus, ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampRepScore } from "@/lib/reputation/validators";

/** Start at 100; open/review hurts modestly; confirmed hurts more. */
export async function computeComplaintScoreComponent(
  entityType: ReputationEntityType,
  entityId: string
): Promise<{ score: number; detail: Record<string, unknown> }> {
  const rows = await prisma.reputationComplaint.findMany({
    where: { entityType, entityId },
    select: { status: true },
  });
  if (rows.length === 0) {
    return { score: 92, detail: { complaintCount: 0 } };
  }

  let penalty = 0;
  const counts: Partial<Record<ComplaintStatus, number>> = {};
  for (const r of rows) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    if (r.status === "open" || r.status === "under_review") penalty += 6;
    if (r.status === "confirmed") penalty += 18;
    if (r.status === "resolved") penalty += 4;
  }

  const score = clampRepScore(100 - Math.min(75, penalty + rows.length * 2));
  return {
    score,
    detail: { total: rows.length, byStatus: counts },
  };
}
