import { prisma } from "@/lib/db";
import { portfolioLog } from "./portfolio-log";

export async function recordPortfolioOutcome(input: {
  assetId?: string | null;
  portfolioId?: string | null;
  eventType: string;
  outcomeCategory?: string | null;
  beforeJson?: Record<string, unknown> | null;
  afterJson?: Record<string, unknown> | null;
  deltaJson?: Record<string, unknown> | null;
  note?: string | null;
}) {
  portfolioLog.assetManager("outcome_record", { eventType: input.eventType });
  return prisma.portfolioOutcomeEvent.create({
    data: {
      assetId: input.assetId ?? undefined,
      portfolioId: input.portfolioId ?? undefined,
      eventType: input.eventType,
      outcomeCategory: input.outcomeCategory ?? undefined,
      beforeJson: input.beforeJson ?? undefined,
      afterJson: input.afterJson ?? undefined,
      deltaJson: input.deltaJson ?? undefined,
      note: input.note ?? undefined,
    },
  });
}
