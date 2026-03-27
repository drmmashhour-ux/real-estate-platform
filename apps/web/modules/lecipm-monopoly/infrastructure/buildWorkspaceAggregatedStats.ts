import { LecipmDealHistoryOutcome, type PrismaClient } from "@prisma/client";
import type { AggregatedDealStats } from "../domain/aggregates";

/**
 * Build aggregate stats for one workspace only. Never joins other workspaces.
 */
export async function buildWorkspaceAggregatedStats(db: PrismaClient, workspaceId: string): Promise<AggregatedDealStats> {
  const histories = await db.lecipmDealHistory.findMany({
    where: { workspaceId },
    select: {
      outcome: true,
      priceCents: true,
      createdAt: true,
      deal: {
        select: {
          id: true,
          createdAt: true,
          brokerId: true,
          possibleBypassFlag: true,
          _count: { select: { documents: true } },
        },
      },
    },
  });

  let won = 0;
  let lost = 0;
  let canceled = 0;
  let daySum = 0;
  let dayCount = 0;
  let priceWonSum = 0;
  let priceWonN = 0;
  let docNumer = 0;
  let docDenom = 0;
  let bypassNumer = 0;
  const brokerIds = new Set<string>();

  for (const h of histories) {
    if (h.outcome === LecipmDealHistoryOutcome.won) won += 1;
    else if (h.outcome === LecipmDealHistoryOutcome.lost) lost += 1;
    else canceled += 1;

    const deal = h.deal;
    if (deal?.brokerId) brokerIds.add(deal.brokerId);

    const days = Math.max(0, (h.createdAt.getTime() - (deal?.createdAt.getTime() ?? h.createdAt.getTime())) / 86400000);
    daySum += days;
    dayCount += 1;

    if (h.outcome === LecipmDealHistoryOutcome.won) {
      priceWonSum += h.priceCents;
      priceWonN += 1;
      if (deal) {
        docDenom += 1;
        if (deal._count.documents > 0) docNumer += 1;
      }
    }
    if (deal?.possibleBypassFlag) bypassNumer += 1;
  }

  const terminal = won + lost + canceled;
  return {
    workspaceId,
    historyRows: histories.length,
    won,
    lost,
    canceled,
    avgDaysToOutcome: dayCount > 0 ? daySum / dayCount : null,
    avgPriceCentsWhenWon: priceWonN > 0 ? priceWonSum / priceWonN : null,
    documentRateWhenWon: docDenom > 0 ? docNumer / docDenom : null,
    bypassFlagRate: terminal > 0 ? bypassNumer / terminal : 0,
    activeBrokersInHistory: brokerIds.size,
  };
}
