import { prisma } from "@/lib/db";

/**
 * Learning loop hooks — position-aware logs for CTR / conversion analysis (additive).
 */
export async function recordRankingImpression(input: {
  listingType?: string;
  listingId: string;
  position?: number;
  pageType?: string;
  city?: string | null;
  userId?: string | null;
  sessionId?: string | null;
}): Promise<void> {
  await prisma.rankingImpressionLog.create({
    data: {
      listingType: (input.listingType ?? "bnhub").slice(0, 32),
      listingId: input.listingId.slice(0, 40),
      position: input.position ?? null,
      pageType: input.pageType?.slice(0, 32) ?? null,
      city: input.city?.slice(0, 128) ?? null,
      userId: input.userId?.slice(0, 64) ?? null,
      sessionId: input.sessionId?.slice(0, 64) ?? null,
    },
  });
}

export async function recordRankingOutcomeEvent(input: {
  listingId: string;
  position: number;
  outcome: "click" | "message" | "booking";
  userId?: string | null;
}): Promise<void> {
  await prisma.rankingClickLog.create({
    data: {
      listingType: "bnhub",
      listingId: input.listingId.slice(0, 40),
      position: input.position,
      pageType: input.outcome,
      userId: input.userId?.slice(0, 64) ?? null,
    },
  });

  void prisma.evolutionOutcomeEvent
    .create({
      data: {
        domain: "ranking",
        metricType: "ranking_outcome",
        entityType: "listing",
        entityId: input.listingId.slice(0, 64),
        expectedJson: { position: input.position },
        actualJson: { outcome: input.outcome },
        notes: "Ranking outcome signal",
      },
    })
    .catch(() => null);
}
