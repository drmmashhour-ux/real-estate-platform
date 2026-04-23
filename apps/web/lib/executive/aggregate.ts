import {
  AiSuggestionStatus,
  ComplianceCaseStatus,
  OfficeReconciliationStatus,
  SystemAlertSeverity,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export type ExecutiveSnapshotMetadata = {
  partialCoverage: boolean;
  aggregatedAt: string;
  /** Human-readable gaps (non-PII). */
  coverageNotes?: string[];
};

export async function buildExecutiveSnapshot(input: { ownerType: string; ownerId: string }) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const listingsCount = await prisma.listing.count();
  const todayListings = await prisma.listing.count({
    where: { createdAt: { gte: since } },
  });

  const dealsCount = await prisma.investmentOpportunity.count();
  const strongDealsCount = await prisma.investmentOpportunity.count({
    where: { score: { gte: 75 } },
  });

  const pipelineDealsCount = await prisma.deal.count();

  const alertsCountSystem = await prisma.systemAlert.count({
    where: { resolvedAt: null },
  });
  const alertsCountAi = await prisma.aiPropertyAlert.count({
    where: { status: "open" },
  });
  const alertsCount = alertsCountSystem + alertsCountAi;

  const highAlertsCountSystem = await prisma.systemAlert.count({
    where: { resolvedAt: null, severity: SystemAlertSeverity.CRITICAL },
  });
  const highAlertsCountAi = await prisma.aiPropertyAlert.count({
    where: { status: "open", severity: { in: ["high", "critical"] } },
  });
  const highAlertsCount = highAlertsCountSystem + highAlertsCountAi;

  const workflowsPending = await prisma.aIWorkflow.count({
    where: { status: "proposed" },
  });

  const buyBoxMatches = await prisma.investmentRecommendation.count({
    where: { status: "active" },
  });
  const savedSearches = await prisma.savedSearch.count();
  const watchlistItems = await prisma.watchlistItem.count();

  const portfolios = await prisma.investorPortfolio.findMany();

  let totalPortfolioValueCents = 0;
  for (const p of portfolios) {
    const v = p.currentValue ?? p.purchasePrice;
    if (typeof v === "number" && Number.isFinite(v)) {
      totalPortfolioValueCents += Math.round(v * 100);
    }
  }
  /** Holdings do not store cashflow; flag in metadata — do not invent. */
  const totalPortfolioCashflowCents: number | null = null;

  const valuationsCount = await prisma.propertyValuation.count();
  const marketReportsCount = await prisma.marketReport.count();

  const transactionRecords = await prisma.brokerTransactionRecord.count();
  const taxRecords = await prisma.taxDocument.count();

  const trustReconciliationMismatchCount = await prisma.officeReconciliationRecord.count({
    where: { status: OfficeReconciliationStatus.discrepancy },
  });

  const complianceCasesOpen = await prisma.complianceCase.count({
    where: {
      status: {
        in: [
          ComplianceCaseStatus.open,
          ComplianceCaseStatus.under_review,
          ComplianceCaseStatus.action_required,
          ComplianceCaseStatus.escalated,
        ],
      },
    },
  });

  const complianceAlerts = complianceCasesOpen;

  const legalAlertsOpen = await prisma.legalAlert.count({
    where: { status: "OPEN" },
  });

  const aiSuggestions = await prisma.aiSuggestion.count({
    where: { status: AiSuggestionStatus.PENDING },
  });

  const autopilotRecommendations = await prisma.portfolioAutopilotRecommendation.count({
    where: { dismissed: false, accepted: false },
  });

  const hotZones = await prisma.marketInvestmentScore.count({
    where: { investmentScore: { gte: 75 } },
  });

  const platformMetrics = {
    listingsCount,
    todayListings,
    dealsCount,
    strongDealsCount,
    pipelineDealsCount,
    alertsCount,
    highAlertsCount,
    workflowsPending,
    buyBoxMatches,
    savedSearches,
    watchlistItems,
  };

  const complianceMetrics = {
    complianceAlerts,
    legalAlertsOpen,
    trustReconciliationMismatchCount,
    taxRecords,
    transactionRecords,
  };

  const financialMetrics = {
    totalPortfolioValueCents,
    totalPortfolioCashflowCents,
    taxRecords,
    transactionRecords,
  };

  const investorMetrics = {
    portfoliosCount: portfolios.length,
    buyBoxMatches,
    watchlistItems,
    autopilotRecommendations,
  };

  const marketMetrics = {
    hotZones,
    dealsCount,
    strongDealsCount,
    valuationsCount,
    marketReportsCount,
  };

  const aiMetrics = {
    aiSuggestions,
    autopilotRecommendations,
    workflowsPending,
  };

  const riskSignals =
    highAlertsCount * 3 +
    (complianceAlerts + legalAlertsOpen) * 2 +
    trustReconciliationMismatchCount * 4 +
    workflowsPending * 0.5;

  let riskLevel = "low";
  if (riskSignals >= 50) riskLevel = "critical";
  else if (riskSignals >= 30) riskLevel = "high";
  else if (riskSignals >= 15) riskLevel = "medium";

  const overallHealthScore = Math.max(0, Math.min(100, 100 - riskSignals));

  const coverageNotes: string[] = [];
  if (totalPortfolioCashflowCents == null) {
    coverageNotes.push("Investor portfolio cashflow not aggregated from holdings (no per-row cashflow field).");
  }
  const partialCoverage =
    coverageNotes.length > 0 ||
    listingsCount + dealsCount + portfolios.length < 3 ||
    trustReconciliationMismatchCount > 0;

  const metadata: ExecutiveSnapshotMetadata = {
    partialCoverage,
    aggregatedAt: new Date().toISOString(),
    coverageNotes: coverageNotes.length ? coverageNotes : undefined,
  };

  const snapshot = await prisma.executiveSnapshot.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      snapshotDate: new Date(),
      platformMetrics,
      complianceMetrics,
      financialMetrics,
      investorMetrics,
      marketMetrics,
      aiMetrics,
      overallHealthScore,
      riskLevel,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  return snapshot;
}
