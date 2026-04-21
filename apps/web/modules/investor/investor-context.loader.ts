import { prisma } from "@/lib/db";

/** Normalized snapshot from listing + ESG stack for memo / IC builders (deterministic inputs). */
export type InvestorListingContext = {
  listingId: string;
  listing: {
    id: string;
    listingCode: string;
    title: string;
    price: number;
    listingType: string;
    ownerId: string | null;
  };
  /** Location strings when unavailable from CRM Listing row alone */
  city: string | null;
  province: string | null;
  buildingFootprintHint: string | null;
  yearBuilt: number | null;
  compliance: {
    blockingIssues: unknown[];
    recommendationText: string | null;
    overallPercent: number | null;
  } | null;
  esgProfile: {
    compositeScore: number | null;
    grade: string | null;
    evidenceConfidence: number | null;
    dataCoveragePercent: number | null;
    energyScore: number | null;
    carbonScore: number | null;
    sustainabilityScore: number | null;
    certification: string | null;
    renovation: boolean;
    solar: boolean;
    highCarbonMaterials: boolean;
  } | null;
  evidenceCounts: {
    documents: number;
    evidenceRows: number;
    events: number;
  };
  investmentOpportunity: {
    score: number;
    expectedROI: number;
    riskLevel: string;
    rationaleJson: unknown;
    createdAt: Date;
  } | null;
  esgActionsOpen: Array<{
    title: string;
    priority: string;
    status: string;
    reasonCode: string;
    estimatedTimelineBand: string | null;
    estimatedCostBand: string | null;
    blockersJson: unknown;
  }>;
  retrofitPlan: {
    planName: string;
    strategyType: string;
    summaryText: string | null;
    totalEstimatedCostBand: string | null;
    totalEstimatedImpactBand: string | null;
    totalTimelineBand: string | null;
    expectedScoreBand: string | null;
    actions: Array<{ title: string; phase: number; impactBand: string | null }>;
  } | null;
  financingOptions: Array<{ name: string; financingType: string; provider: string | null; reasoning: string | null }>;
  retrofitScenarioLatest: {
    financingFit: string | null;
    timelineBand: string | null;
    totalCostBand: string | null;
    totalImpactBand: string | null;
  } | null;
  optimizerPlan: {
    strategyType: string | null;
    objectiveMode: string | null;
    headlineRecommendation: string | null;
    executiveSummary: string | null;
    confidenceLevel: string | null;
    status: string;
    planJson: unknown;
    actions: Array<{
      title: string;
      rank: number;
      expectedScoreImpactBand: string | null;
      expectedConfidenceImpactBand: string | null;
      costBand: string | null;
      timelineBand: string | null;
    }>;
  } | null;
};

export async function loadInvestorListingContext(listingId: string): Promise<InvestorListingContext | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      listingCode: true,
      title: true,
      price: true,
      listingType: true,
      ownerId: true,
    },
  });
  if (!listing) return null;

  const [
    compliance,
    esgProfile,
    docCount,
    evidenceCount,
    eventCount,
    latestOpp,
    openActions,
    retrofitLatest,
    financing,
    scenarioLatest,
    optimizerLatest,
  ] = await Promise.all([
    prisma.listingComplianceSnapshot.findUnique({
      where: { listingId },
      select: {
        blockingIssuesJson: true,
        recommendationText: true,
        overallPercent: true,
      },
    }),
    prisma.esgProfile.findUnique({
      where: { listingId },
    }),
    prisma.esgDocument.count({ where: { listingId } }),
    prisma.esgEvidence.count({ where: { listingId } }),
    prisma.esgEvent.count({ where: { listingId } }),
    prisma.investmentOpportunity.findFirst({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      select: {
        score: true,
        expectedROI: true,
        riskLevel: true,
        rationaleJson: true,
        createdAt: true,
      },
    }),
    prisma.esgAction.findMany({
      where: { listingId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      take: 25,
      select: {
        title: true,
        priority: true,
        status: true,
        reasonCode: true,
        estimatedTimelineBand: true,
        estimatedCostBand: true,
        blockersJson: true,
      },
    }),
    prisma.esgRetrofitPlan.findFirst({
      where: { listingId },
      orderBy: { updatedAt: "desc" },
      include: {
        retrofitActions: {
          orderBy: { phase: "asc" },
          take: 12,
          select: { title: true, phase: true, impactBand: true },
        },
      },
    }),
    prisma.esgFinancingOption.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { name: true, financingType: true, provider: true, reasoning: true },
    }),
    prisma.esgRetrofitScenario.findFirst({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      select: {
        financingFit: true,
        timelineBand: true,
        totalCostBand: true,
        totalImpactBand: true,
      },
    }),
    prisma.esgOptimizationPlan.findFirst({
      where: { listingId },
      orderBy: { updatedAt: "desc" },
      include: {
        optimizationActions: {
          orderBy: { rank: "asc" },
          take: 12,
          select: {
            title: true,
            rank: true,
            expectedScoreImpactBand: true,
            expectedConfidenceImpactBand: true,
            costBand: true,
            timelineBand: true,
          },
        },
      },
    }),
  ]);

  const blockingIssues = Array.isArray(compliance?.blockingIssuesJson) ?
      (compliance?.blockingIssuesJson as unknown[])
    : [];

  return {
    listingId: listing.id,
    listing: {
      id: listing.id,
      listingCode: listing.listingCode,
      title: listing.title,
      price: listing.price,
      listingType: listing.listingType,
      ownerId: listing.ownerId,
    },
    city: null,
    province: null,
    buildingFootprintHint: null,
    yearBuilt: null,
    compliance:
      compliance ?
        {
          blockingIssues,
          recommendationText: compliance.recommendationText,
          overallPercent: compliance.overallPercent,
        }
      : null,
    esgProfile:
      esgProfile ?
        {
          compositeScore: esgProfile.compositeScore,
          grade: esgProfile.grade,
          evidenceConfidence: esgProfile.evidenceConfidence,
          dataCoveragePercent: esgProfile.dataCoveragePercent,
          energyScore: esgProfile.energyScore,
          carbonScore: esgProfile.carbonScore,
          sustainabilityScore: esgProfile.sustainabilityScore,
          certification: esgProfile.certification,
          renovation: esgProfile.renovation,
          solar: esgProfile.solar,
          highCarbonMaterials: esgProfile.highCarbonMaterials,
        }
      : null,
    evidenceCounts: {
      documents: docCount,
      evidenceRows: evidenceCount,
      events: eventCount,
    },
    investmentOpportunity: latestOpp,
    esgActionsOpen: openActions,
    retrofitPlan:
      retrofitLatest ?
        {
          planName: retrofitLatest.planName,
          strategyType: retrofitLatest.strategyType,
          summaryText: retrofitLatest.summaryText,
          totalEstimatedCostBand: retrofitLatest.totalEstimatedCostBand,
          totalEstimatedImpactBand: retrofitLatest.totalEstimatedImpactBand,
          totalTimelineBand: retrofitLatest.totalTimelineBand,
          expectedScoreBand: retrofitLatest.expectedScoreBand,
          actions: retrofitLatest.retrofitActions.map((a) => ({
            title: a.title,
            phase: a.phase,
            impactBand: a.impactBand,
          })),
        }
      : null,
    financingOptions: financing,
    retrofitScenarioLatest: scenarioLatest,
    optimizerPlan:
      optimizerLatest ?
        {
          strategyType: optimizerLatest.strategyType,
          objectiveMode: optimizerLatest.objectiveMode,
          headlineRecommendation: optimizerLatest.headlineRecommendation,
          executiveSummary: optimizerLatest.executiveSummary,
          confidenceLevel: optimizerLatest.confidenceLevel,
          status: optimizerLatest.status,
          planJson: optimizerLatest.planJson,
          actions: optimizerLatest.optimizationActions,
        }
      : null,
  };
}
