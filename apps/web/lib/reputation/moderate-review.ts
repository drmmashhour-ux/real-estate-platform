import type { ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { updateReputationScore } from "@/lib/reputation/update-reputation-score";

export async function moderateReputationReview(reviewId: string, status: ReviewStatus): Promise<void> {
  const row = await prisma.reputationReview.update({
    where: { id: reviewId },
    data: { status },
  });
  await updateReputationScore(row.subjectEntityType, row.subjectEntityId);
  if (row.subjectEntityType === "listing") {
    const l = await prisma.shortTermListing.findUnique({
      where: { id: row.subjectEntityId },
      select: { ownerId: true },
    });
    if (l) await updateReputationScore("host", l.ownerId);
  }
}
