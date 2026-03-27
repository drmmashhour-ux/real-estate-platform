import { prisma } from "@/lib/db";

export async function recordExtractionReviewAction(args: {
  recordId: string;
  reviewerId: string;
  actionType: string;
  notes?: string | null;
}) {
  await prisma.trustgraphExtractionReviewAction.create({
    data: {
      recordId: args.recordId,
      reviewerId: args.reviewerId,
      actionType: args.actionType,
      notes: args.notes ?? undefined,
    },
  });
  await prisma.trustgraphExtractedDocumentRecord.update({
    where: { id: args.recordId },
    data: { reviewedBy: args.reviewerId, reviewedAt: new Date() },
  });
}
