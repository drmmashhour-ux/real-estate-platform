import { prisma } from "@/lib/db";
import type { RankingListingType } from "@/src/modules/ranking/dataMap";
import type { RankingPageType, RankingSearchContext } from "@/src/modules/ranking/types";

export async function logRankingImpressions(
  listingType: RankingListingType,
  items: { listingId: string; position: number }[],
  ctx: Pick<RankingSearchContext, "pageType" | "city" | "userId" | "sessionId">
): Promise<void> {
  if (items.length === 0) return;
  const pageType = (ctx.pageType ?? "search") as RankingPageType;
  const city = ctx.city?.slice(0, 128) ?? null;
  await prisma.rankingImpressionLog.createMany({
    data: items.map((it) => ({
      listingType,
      listingId: it.listingId,
      pageType,
      position: it.position,
      city,
      userId: ctx.userId ?? undefined,
      sessionId: ctx.sessionId?.slice(0, 64) ?? undefined,
    })),
  });
}

export async function logRankingClick(
  listingType: RankingListingType,
  listingId: string,
  ctx: Pick<RankingSearchContext, "pageType" | "position" | "userId" | "sessionId">
): Promise<void> {
  await prisma.rankingClickLog.create({
    data: {
      listingType,
      listingId,
      pageType: ctx.pageType ?? "search",
      position: ctx.position ?? null,
      userId: ctx.userId ?? undefined,
      sessionId: ctx.sessionId?.slice(0, 64) ?? undefined,
    },
  });
}
