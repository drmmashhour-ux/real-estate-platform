import { prisma } from "@/lib/db";

export async function markBriefingReviewed(briefingId: string, reviewerUserId: string): Promise<void> {
  await prisma.executiveBriefing.update({
    where: { id: briefingId },
    data: {
      status: "reviewed",
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
    },
  });
}

export async function archiveBriefing(briefingId: string): Promise<void> {
  await prisma.executiveBriefing.update({
    where: { id: briefingId },
    data: { status: "archived" },
  });
}
