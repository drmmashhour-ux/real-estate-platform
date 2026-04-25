import { prisma } from "@/lib/db";
import { QC_CONDITION_TYPES } from "@/modules/quebec-closing/quebec-closing.types";

function fallbackDeadline(daysFromNow: number) {
  return new Date(Date.now() + daysFromNow * 86_400_000);
}

/**
 * Seeds standard Québec private-sale conditions with explicit deadlines (offer draft dates when present).
 * Idempotent: skips if any condition already exists for the deal.
 */
export async function seedDefaultQuebecClosingConditions(dealId: string): Promise<void> {
  const count = await prisma.dealClosingCondition.count({ where: { dealId } });
  if (count > 0) return;

  const draft = await prisma.offerDraft.findFirst({
    where: { dealId },
    orderBy: { createdAt: "desc" },
    select: { financingDeadline: true, inspectionDeadline: true },
  });

  const financingDl = draft?.financingDeadline ?? fallbackDeadline(21);
  const inspectionDl = draft?.inspectionDeadline ?? fallbackDeadline(14);
  const documentDl = fallbackDeadline(14);

  await prisma.dealClosingCondition.createMany({
    data: [
      {
        dealId,
        conditionType: QC_CONDITION_TYPES.financing,
        deadline: financingDl,
        status: "pending",
        notes: "Financing condition — lender commitment / waiver per promise.",
      },
      {
        dealId,
        conditionType: QC_CONDITION_TYPES.inspection,
        deadline: inspectionDl,
        status: "pending",
        notes: "Inspection / building review — reports and waiver per promise.",
      },
      {
        dealId,
        conditionType: QC_CONDITION_TYPES.document_review,
        deadline: documentDl,
        status: "pending",
        notes: "Document review — seller declarations, annexes, and pre-notarial file completeness.",
      },
    ],
  });
}
