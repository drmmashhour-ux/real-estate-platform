import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import type { PortfolioTrustAnalyticsDto } from "@/lib/trustgraph/domain/portfolio";
import type { PortfolioTrustAnalyticsFilter } from "@/lib/trustgraph/domain/portfolio";
import { isTrustGraphPortfolioAnalyticsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { emptyPortfolioAnalytics } from "@/lib/trustgraph/infrastructure/services/portfolioHealthService";

export async function getPortfolioTrustAnalyticsForWorkspace(
  workspaceId: string,
  filter: PortfolioTrustAnalyticsFilter
): Promise<PortfolioTrustAnalyticsDto> {
  if (!isTrustGraphEnabled() || !isTrustGraphPortfolioAnalyticsEnabled()) {
    return emptyPortfolioAnalytics();
  }

  const cfg = getPhase7EnterpriseConfig();
  const links = await prisma.trustgraphComplianceWorkspaceEntityLink.findMany({
    where: { workspaceId, entityType: filter.entityType ?? "LISTING" },
    select: { entityId: true },
  });
  const ids = links.map((l) => l.entityId);
  if (ids.length < cfg.portfolio.minListingsForPercent) {
    return { ...emptyPortfolioAnalytics(), totalListings: ids.length };
  }

  const cases = await prisma.verificationCase.findMany({
    where: {
      entityType: "LISTING",
      entityId: { in: ids },
      ...(filter.trustLevel ? { trustLevel: filter.trustLevel as "low" | "medium" | "high" | "verified" } : {}),
      ...(filter.readinessLevel
        ? {
            readinessLevel: filter.readinessLevel as "not_ready" | "partial" | "ready" | "action_required",
          }
        : {}),
      ...(filter.from || filter.to
        ? {
            updatedAt: {
              ...(filter.from ? { gte: filter.from } : {}),
              ...(filter.to ? { lte: filter.to } : {}),
            },
          }
        : {}),
    },
    select: {
      trustLevel: true,
      readinessLevel: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
    },
  });

  const totalListings = ids.length;
  const verifiedHigh = cases.filter((c) => c.trustLevel === "verified" || c.trustLevel === "high").length;
  const verifiedHighTrustPercent = Math.round((verifiedHigh / Math.max(1, cases.length)) * 100);

  const critical = cases.filter((c) => c.readinessLevel === "action_required").length;
  const criticalUnresolvedPercent = Math.round((critical / Math.max(1, cases.length)) * 100);

  const incompleteDeclarationsPercent = criticalUnresolvedPercent;

  let hoursSum = 0;
  let hoursN = 0;
  for (const c of cases) {
    if (c.resolvedAt) {
      hoursSum += (c.resolvedAt.getTime() - c.createdAt.getTime()) / 3600000;
      hoursN += 1;
    }
  }
  const avgHoursToVerification = hoursN > 0 ? Math.round((hoursSum / hoursN) * 10) / 10 : null;

  const slaStates = await prisma.trustgraphCaseSlaState.findMany({
    where: {
      workspaceId,
      case: { entityType: "LISTING", entityId: { in: ids } },
    },
    select: { state: true },
  });
  const breach = slaStates.filter((s) => s.state === "overdue" || s.state === "escalated").length;
  const slaBreachRatePercent =
    slaStates.length > 0 ? Math.round((breach / slaStates.length) * 100) : null;

  void recordPlatformEvent({
    eventType: "trustgraph_portfolio_analytics_generated",
    sourceModule: "trustgraph",
    entityType: "COMPLIANCE_WORKSPACE",
    entityId: workspaceId,
    payload: { listingCount: ids.length, caseSample: cases.length },
  }).catch(() => {});

  return {
    totalListings,
    verifiedHighTrustPercent,
    incompleteDeclarationsPercent,
    criticalUnresolvedPercent,
    premiumEligiblePercent: null,
    brokerVerifiedRatePercent: null,
    mortgageReadinessDistribution: [
      { bucket: "not_ready", count: cases.filter((c) => c.readinessLevel === "not_ready").length },
      { bucket: "partial", count: cases.filter((c) => c.readinessLevel === "partial").length },
      { bucket: "ready", count: cases.filter((c) => c.readinessLevel === "ready").length },
      { bucket: "action_required", count: cases.filter((c) => c.readinessLevel === "action_required").length },
    ],
    avgHoursToVerification,
    slaBreachRatePercent,
  };
}
