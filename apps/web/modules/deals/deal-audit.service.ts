import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[deal.audit]";

export async function appendDealAuditEvent(
  delegate: Prisma.TransactionClient | typeof prisma,
  input: {
    dealId: string;
    eventType: string;
    actorUserId?: string | null;
    summary: string;
    metadataJson?: Prisma.InputJsonValue | null;
  }
) {
  await delegate.lecipmPipelineDealAuditEvent.create({
    data: {
      dealId: input.dealId,
      eventType: input.eventType.slice(0, 64),
      actorUserId: input.actorUserId ?? undefined,
      summary: input.summary.slice(0, 8000),
      metadataJson: input.metadataJson ?? undefined,
    },
  });
  logInfo(TAG, { dealId: input.dealId, eventType: input.eventType });
}
