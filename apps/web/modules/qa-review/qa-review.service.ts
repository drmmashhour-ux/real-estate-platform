import type { QaReviewType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { complianceAuditKeys, logComplianceAudit } from "@/lib/admin/compliance-audit";
import { qaReviewDisclaimer } from "@/modules/compliance-admin/compliance-explainer";
import { seedDefaultChecklist } from "./review-checklist.service";
import { suggestReviewerForDeal } from "./review-routing.service";

export async function createQaReview(input: {
  actorUserId: string;
  dealId?: string | null;
  documentId?: string | null;
  reviewType: QaReviewType;
  assign?: boolean;
}) {
  const assignedToUserId =
    input.assign && input.dealId ? await suggestReviewerForDeal(input.dealId, input.reviewType) : null;

  const review = await prisma.qaReview.create({
    data: {
      dealId: input.dealId ?? undefined,
      documentId: input.documentId ?? undefined,
      reviewType: input.reviewType,
      status: "pending",
      requestedByUserId: input.actorUserId,
      assignedToUserId: assignedToUserId ?? undefined,
    },
  });

  await seedDefaultChecklist(review.id);

  await logComplianceAudit({
    actorUserId: input.actorUserId,
    actionKey: complianceAuditKeys.reviewCreated,
    reviewId: review.id,
    payload: { reviewType: input.reviewType, dealId: input.dealId },
  });

  return { review, disclaimer: qaReviewDisclaimer() };
}

export async function getQaReview(id: string) {
  return prisma.qaReview.findUnique({
    where: { id },
    include: {
      checklistItems: { orderBy: { createdAt: "asc" } },
      deal: { select: { id: true, dealCode: true, brokerId: true, status: true } },
    },
  });
}

export async function listQaReviews(q: { status?: string; take?: number }) {
  return prisma.qaReview.findMany({
    where: q.status ? { status: q.status as import("@prisma/client").QaReviewStatus } : {},
    orderBy: { updatedAt: "desc" },
    take: q.take ?? 60,
    include: {
      deal: { select: { id: true, dealCode: true, brokerId: true } },
    },
  });
}
