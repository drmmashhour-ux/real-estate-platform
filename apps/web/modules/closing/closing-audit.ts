import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

function logTagForEvent(eventType: string): string {
  if (eventType.startsWith("DOCUMENT_")) return "[closing-document]";
  if (eventType.startsWith("CHECKLIST") || eventType.includes("CHECKLIST")) return "[closing-checklist]";
  if (eventType.includes("SIGNATURE")) return "[closing-signature]";
  if (eventType === "CLOSED" || eventType === "FAILED" || eventType === "STARTED") return "[closing-room]";
  if (eventType.includes("POST_CLOSE") || eventType.includes("ASSET")) return "[asset-onboarding]";
  return "[closing-room]";
}

export async function appendClosingAudit(options: {
  dealId: string;
  actorUserId?: string | null;
  eventType: string;
  note?: string | null;
  metadataJson?: Record<string, unknown>;
}): Promise<void> {
  await prisma.dealClosingAudit.create({
    data: {
      dealId: options.dealId,
      actorUserId: options.actorUserId ?? null,
      eventType: options.eventType,
      note: options.note ?? null,
      metadataJson: options.metadataJson ?? {},
    },
  });
  logInfo(logTagForEvent(options.eventType), {
    dealId: options.dealId,
    eventType: options.eventType,
  });
}
