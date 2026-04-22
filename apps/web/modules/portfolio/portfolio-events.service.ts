import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function appendPortfolioAuditEvent(
  portfolioId: string,
  input: {
    eventType: string;
    summary: string;
    actorUserId?: string | null;
    metadataJson?: Prisma.InputJsonValue | null;
  }
) {
  await prisma.lecipmPortfolioOsAuditEvent.create({
    data: {
      portfolioId,
      eventType: input.eventType.slice(0, 64),
      summary: input.summary.slice(0, 8000),
      actorUserId: input.actorUserId ?? undefined,
      metadataJson: input.metadataJson ?? undefined,
    },
  });
}
