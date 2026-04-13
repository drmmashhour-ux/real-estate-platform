import type { ComplaintStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { updateReputationScore } from "@/lib/reputation/update-reputation-score";

export async function reviewReputationComplaint(complaintId: string, status: ComplaintStatus): Promise<void> {
  const row = await prisma.reputationComplaint.update({
    where: { id: complaintId },
    data: { status },
  });
  await updateReputationScore(row.entityType, row.entityId);
}
