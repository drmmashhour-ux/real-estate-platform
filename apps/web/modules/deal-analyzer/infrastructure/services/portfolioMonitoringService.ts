import { prisma } from "@/lib/db";
import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { PortfolioMonitoringEventType } from "@/modules/deal-analyzer/domain/monitoring";
import { logDealAnalyzerPhase4 } from "@/modules/deal-analyzer/infrastructure/services/phase4Logger";

export async function runPortfolioMonitoringForWatchlist(args: { watchlistId: string; userId: string }) {
  const wl = await prisma.dealWatchlist.findFirst({
    where: { id: args.watchlistId, ownerId: args.userId },
  });
  if (!wl) return { ok: false as const, error: "Watchlist not found" };

  const items = await prisma.dealWatchlistItem.findMany({ where: { watchlistId: args.watchlistId } });
  const scoreTh = dealAnalyzerConfig.phase4.monitoring.opportunityShiftMinPoints;
  const riskTh = dealAnalyzerConfig.phase4.monitoring.trustDropMinPoints;

  let upgraded = 0;
  let downgraded = 0;
  let riskIncreased = 0;
  const movers: { propertyId: string; deltaScore: number }[] = [];
  let repricingRecommended = 0;

  for (const item of items) {
    const analysis = await prisma.dealAnalysis.findFirst({
      where: { propertyId: item.propertyId },
      orderBy: { createdAt: "desc" },
    });
    if (!analysis) continue;

    const prevInv = item.lastInvestmentScore;
    const prevRisk = item.lastRiskScore;

    if (prevInv != null && analysis.investmentScore - prevInv >= scoreTh) {
      upgraded += 1;
      movers.push({ propertyId: item.propertyId, deltaScore: analysis.investmentScore - prevInv });
      await prisma.portfolioMonitoringEvent.create({
        data: {
          watchlistId: args.watchlistId,
          propertyId: item.propertyId,
          eventType: PortfolioMonitoringEventType.OPPORTUNITY_UPGRADED,
          severity: "info",
          title: "Investment score increased",
          message: `Score ${prevInv} → ${analysis.investmentScore} (rules-based snapshot).`,
          metadata: { from: prevInv, to: analysis.investmentScore },
        },
      });
    }

    if (prevInv != null && prevInv - analysis.investmentScore >= scoreTh) {
      downgraded += 1;
      await prisma.portfolioMonitoringEvent.create({
        data: {
          watchlistId: args.watchlistId,
          propertyId: item.propertyId,
          eventType: PortfolioMonitoringEventType.OPPORTUNITY_DOWNGRADED,
          severity: "warning",
          title: "Investment score decreased",
          message: `Score ${prevInv} → ${analysis.investmentScore}.`,
          metadata: { from: prevInv, to: analysis.investmentScore },
        },
      });
    }

    if (prevRisk != null && analysis.riskScore - prevRisk >= riskTh) {
      riskIncreased += 1;
      await prisma.portfolioMonitoringEvent.create({
        data: {
          watchlistId: args.watchlistId,
          propertyId: item.propertyId,
          eventType: PortfolioMonitoringEventType.TRUST_DROPPED,
          severity: "warning",
          title: "Risk score increased",
          message: `Risk ${prevRisk} → ${analysis.riskScore} (platform heuristic).`,
          metadata: { from: prevRisk, to: analysis.riskScore },
        },
      });
    }

    const openReprice = await prisma.sellerRepricingTrigger.count({
      where: { propertyId: item.propertyId, status: "open" },
    });
    if (openReprice > 0) repricingRecommended += 1;

    await prisma.dealWatchlistItem.update({
      where: { id: item.id },
      data: {
        lastInvestmentScore: analysis.investmentScore,
        lastRiskScore: analysis.riskScore,
        lastOpportunityType: analysis.opportunityType,
      },
    });
  }

  movers.sort((a, b) => Math.abs(b.deltaScore) - Math.abs(a.deltaScore));

  const summary = {
    watchlistId: args.watchlistId,
    evaluatedAt: new Date().toISOString(),
    upgradedCount: upgraded,
    downgradedCount: downgraded,
    trustDroppedCount: riskIncreased,
    repricingRecommendedCount: repricingRecommended,
    biggestMovers: movers.slice(0, 8),
    confidence: items.length >= 4 ? "medium" : "low",
    warnings: [dealAnalyzerConfig.phase4.disclaimers.monitoring],
  };

  await prisma.portfolioMonitoringSnapshot.create({
    data: {
      watchlistId: args.watchlistId,
      summary: summary as object,
    },
  });

  logDealAnalyzerPhase4("portfolio_monitoring_run", {
    watchlistId: args.watchlistId,
    upgraded: String(upgraded),
    downgraded: String(downgraded),
    confidence: summary.confidence,
  });

  return { ok: true as const, summary };
}
