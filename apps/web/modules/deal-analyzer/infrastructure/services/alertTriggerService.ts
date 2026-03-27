import { prisma } from "@/lib/db";
import { dealAnalyzerConfig } from "@/config/dealAnalyzer";
import { DealAlertType, AlertSeverity } from "@/modules/deal-analyzer/domain/alerts";
import { logDealAnalyzerPhase3 } from "@/modules/deal-analyzer/infrastructure/services/phase3Logger";

export async function evaluateWatchlistAlerts(watchlistId: string): Promise<{ created: number }> {
  const items = await prisma.dealWatchlistItem.findMany({ where: { watchlistId } });
  let created = 0;
  const th = dealAnalyzerConfig.phase3.alerts;

  for (const item of items) {
    const row = await prisma.dealAnalysis.findFirst({
      where: { propertyId: item.propertyId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) continue;

    const prevInv = item.lastInvestmentScore;
    const prevRisk = item.lastRiskScore;
    const prevOpp = item.lastOpportunityType;

    if (prevInv != null && row.investmentScore - prevInv >= th.scoreChangeMinPoints) {
      await prisma.dealPortfolioAlert.create({
        data: {
          watchlistId,
          propertyId: item.propertyId,
          alertType: DealAlertType.SCORE_IMPROVED,
          severity: AlertSeverity.INFO,
          title: "Investment score increased",
          message: `Score moved from ${prevInv} to ${row.investmentScore} (rules-based snapshot).`,
          metadata: { from: prevInv, to: row.investmentScore },
        },
      });
      created += 1;
    }

    if (prevInv != null && prevInv - row.investmentScore >= th.scoreChangeMinPoints) {
      await prisma.dealPortfolioAlert.create({
        data: {
          watchlistId,
          propertyId: item.propertyId,
          alertType: DealAlertType.SCORE_DROPPED,
          severity: AlertSeverity.WARNING,
          title: "Investment score decreased",
          message: `Score moved from ${prevInv} to ${row.investmentScore}.`,
          metadata: { from: prevInv, to: row.investmentScore },
        },
      });
      created += 1;
    }

    if (prevRisk != null && row.riskScore - prevRisk >= th.riskIncreaseMinPoints) {
      await prisma.dealPortfolioAlert.create({
        data: {
          watchlistId,
          propertyId: item.propertyId,
          alertType: DealAlertType.RISK_INCREASED,
          severity: AlertSeverity.WARNING,
          title: "Risk score increased",
          message: `Risk moved from ${prevRisk} to ${row.riskScore}.`,
          metadata: { from: prevRisk, to: row.riskScore },
        },
      });
      created += 1;
    }

    if (prevOpp != null && prevOpp !== row.opportunityType) {
      await prisma.dealPortfolioAlert.create({
        data: {
          watchlistId,
          propertyId: item.propertyId,
          alertType: DealAlertType.OPPORTUNITY_UPGRADED,
          severity: AlertSeverity.INFO,
          title: "Opportunity label changed",
          message: `Opportunity type: ${prevOpp} → ${row.opportunityType}.`,
          metadata: { from: prevOpp, to: row.opportunityType },
        },
      });
      created += 1;
    }

    await prisma.dealWatchlistItem.update({
      where: { id: item.id },
      data: {
        lastInvestmentScore: row.investmentScore,
        lastRiskScore: row.riskScore,
        lastOpportunityType: row.opportunityType,
      },
    });
  }

  logDealAnalyzerPhase3("deal_analyzer_watchlist_alerts", {
    watchlistId,
    alertsCreated: String(created),
    trigger: "evaluateWatchlistAlerts",
  });

  return { created };
}
