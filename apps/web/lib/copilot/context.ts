import { prisma } from "@/lib/db";

/**
 * Compact, non-PII context for proactive suggestion AI (watchlist, searches, pipeline, portfolio).
 */
export async function buildCopilotContext(input: {
  ownerType: string;
  ownerId: string;
  contextType: string;
}) {
  const userId = input.ownerId;

  const [
    watchlistItemCount,
    savedSearchCount,
    portfolioHoldingCount,
    dealTouchCount,
    investmentDealCount,
    openProactiveCount,
  ] = await Promise.all([
    prisma.watchlistItem.count({
      where: { watchlist: { userId } },
    }),
    prisma.savedSearch.count({ where: { userId } }),
    prisma.investorPortfolio.count({ where: { userId } }),
    prisma.deal.count({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }, { brokerId: userId }],
      },
    }),
    prisma.investmentDeal.count({ where: { userId } }),
    prisma.lecipmProactiveSuggestion.count({
      where: {
        ownerType: input.ownerType,
        ownerId: userId,
        dismissed: false,
        accepted: false,
      },
    }),
  ]);

  return {
    contextType: input.contextType,
    ownerType: input.ownerType,
    counts: {
      watchlistItemCount,
      savedSearchCount,
      portfolioHoldingCount,
      dealTouchCount,
      investmentDealCount,
      openProactiveSuggestionCount: openProactiveCount,
    },
  };
}
