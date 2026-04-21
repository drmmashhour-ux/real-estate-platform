import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { appendClosingAudit } from "@/modules/closing/closing-audit";
import { syncDealClosingReadiness } from "@/modules/closing/closing-orchestrator";

const TAG = "[closing-checklist]";

const DEFAULT_ITEMS: Array<{
  title: string;
  category: string;
  priority: string | null;
}> = [
  { title: "Legal review — purchase & ancillary agreements", category: "LEGAL", priority: "CRITICAL" },
  { title: "Capital / lender funds ready & undertakings acknowledged", category: "CAPITAL", priority: "CRITICAL" },
  { title: "Documentation package indexed (closing room)", category: "DOCUMENTATION", priority: "HIGH" },
  { title: "ESG / regulatory disclosures (where applicable)", category: "ESG", priority: "OPTIONAL" },
  { title: "Final broker / execution approval", category: "FINAL_APPROVAL", priority: "CRITICAL" },
  { title: "Possession / keys / meter transfers scheduled", category: "EXECUTION", priority: "HIGH" },
];

export async function seedDefaultClosingChecklist(dealId: string): Promise<number> {
  const existing = await prisma.dealClosingChecklist.count({ where: { dealId } });
  if (existing > 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const row of DEFAULT_ITEMS) {
      await tx.dealClosingChecklist.create({
        data: {
          dealId,
          title: row.title,
          category: row.category,
          priority: row.priority,
          status: "OPEN",
        },
      });
    }
  });

  logInfo(`${TAG}`, { dealId, seeded: DEFAULT_ITEMS.length });
  return DEFAULT_ITEMS.length;
}

export async function updateChecklistItemStatus(options: {
  dealId: string;
  itemId: string;
  actorUserId: string;
  status: string;
  notes?: string | null;
  ownerUserId?: string | null;
}): Promise<void> {
  const row = await prisma.dealClosingChecklist.findFirst({
    where: { id: options.itemId, dealId: options.dealId },
    select: { id: true, status: true },
  });
  if (!row) throw new Error("Checklist item not found");

  await prisma.dealClosingChecklist.update({
    where: { id: row.id },
    data: {
      status: options.status,
      notes: options.notes ?? undefined,
      ownerUserId: options.ownerUserId ?? undefined,
      updatedAt: new Date(),
    },
  });

  await appendClosingAudit({
    dealId: options.dealId,
    actorUserId: options.actorUserId,
    eventType: "CHECKLIST_UPDATED",
    note: `${row.status} → ${options.status}`,
    metadataJson: { itemId: options.itemId },
  });

  await syncDealClosingReadiness(options.dealId);
  logInfo(`${TAG}`, { dealId: options.dealId, itemId: options.itemId });
}
