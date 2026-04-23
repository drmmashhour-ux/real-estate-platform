import { prisma } from "@/lib/db";
import { appendDealAuditEvent } from "@/modules/deals/deal-audit.service";
import { logClosingTimeline } from "./closing-timeline.service";

const DEFAULT_ITEMS: Array<{ label: string; isCritical: boolean }> = [
  { label: "All documents signed (transaction file)", isCritical: true },
  { label: "Financing conditions satisfied", isCritical: true },
  { label: "Notary package ready", isCritical: true },
  { label: "Identity verification complete", isCritical: true },
  { label: "Funds confirmed", isCritical: true },
  { label: "Final documents uploaded", isCritical: true },
];

export async function createDefaultChecklistItems(closingId: string, transactionId: string | null) {
  for (const item of DEFAULT_ITEMS) {
    await prisma.lecipmPipelineDealClosingChecklistItem.create({
      data: {
        closingId,
        label: item.label,
        status: "PENDING",
        isCritical: item.isCritical,
      },
    });
  }
  await logClosingTimeline(transactionId, "CLOSING_CHECKLIST_CREATED", "Default closing checklist initialized");
}

export async function seedDefaultClosingChecklist(closingId: string, transactionId: string | null) {
  return createDefaultChecklistItems(closingId, transactionId);
}

export async function listChecklistItems(closingId: string) {
  return prisma.lecipmPipelineDealClosingChecklistItem.findMany({
    where: { closingId },
    orderBy: { label: "asc" },
  });
}

export async function updateChecklistItemStatus(
  itemId: string,
  status: string,
  dealId: string,
  actorUserId: string | null,
  transactionId: string | null
) {
  const item = await prisma.lecipmPipelineDealClosingChecklistItem.findUnique({
    where: { id: itemId },
    include: { closing: true },
  });
  if (!item || item.closing.dealId !== dealId) throw new Error("Checklist item not found");

  const st = status.slice(0, 16).toUpperCase();
  const row = await prisma.lecipmPipelineDealClosingChecklistItem.update({
    where: { id: itemId },
    data: { status: st },
  });

  await appendDealAuditEvent(prisma, {
    dealId,
    eventType: "CLOSING_CHECKLIST_UPDATED",
    actorUserId,
    summary: `Checklist "${item.label}" → ${st}`,
    metadataJson: { itemId },
  });
  await logClosingTimeline(transactionId, "CLOSING_CHECKLIST_UPDATED", `${item.label}: ${st}`);

  return row;
}
