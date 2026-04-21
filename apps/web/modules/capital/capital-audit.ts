import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";

const TAG = "[capital]";

export async function appendCapitalAudit(options: {
  pipelineDealId: string;
  actorUserId?: string | null;
  eventType: string;
  note?: string | null;
  metadataJson?: Record<string, unknown>;
}): Promise<void> {
  await prisma.investmentPipelineCapitalAudit.create({
    data: {
      pipelineDealId: options.pipelineDealId,
      actorUserId: options.actorUserId ?? null,
      eventType: options.eventType,
      note: options.note ?? null,
      metadataJson: options.metadataJson ?? {},
    },
  });
  logInfo(`${TAG}`, { dealId: options.pipelineDealId, eventType: options.eventType });
}
