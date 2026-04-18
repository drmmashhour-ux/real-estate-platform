import { prisma } from "@/lib/db";
import type { QaChecklistItemStatus } from "@prisma/client";

const DEFAULT_ITEMS: { itemKey: string; itemLabel: string }[] = [
  { itemKey: "forms_complete", itemLabel: "Required forms present (platform row set)" },
  { itemKey: "fields_coherent", itemLabel: "Key fields coherent across documents" },
  { itemKey: "broker_approval", itemLabel: "Broker approval / review gates addressed" },
  { itemKey: "signatures_conditions", itemLabel: "Signatures, conditions, payment states coherent" },
];

export async function seedDefaultChecklist(reviewId: string) {
  await prisma.qaReviewChecklistItem.createMany({
    data: DEFAULT_ITEMS.map((i) => ({
      reviewId,
      itemKey: i.itemKey,
      itemLabel: i.itemLabel,
      status: "pending" as QaChecklistItemStatus,
    })),
  });
}

export async function updateChecklistItem(
  id: string,
  patch: { status?: QaChecklistItemStatus; reviewerNote?: string | null },
) {
  return prisma.qaReviewChecklistItem.update({
    where: { id },
    data: {
      ...(patch.status ? { status: patch.status } : {}),
      ...(patch.reviewerNote !== undefined ? { reviewerNote: patch.reviewerNote } : {}),
    },
  });
}
