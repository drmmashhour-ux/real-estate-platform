import { prisma } from "@/lib/db";
import { recordPlatformEvent } from "@/lib/observability";
import { getPhase7EnterpriseConfig } from "@/lib/trustgraph/config/phase7-enterprise";
import type { WhiteLabelDashboardSafeDto } from "@/lib/trustgraph/domain/dashboard";
import { isTrustGraphWhiteLabelDashboardsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { parseWorkspaceBranding } from "@/lib/trustgraph/infrastructure/services/dashboardBrandingService";
import { countOpenWorkspaceCases } from "@/lib/trustgraph/infrastructure/services/workspaceAnalyticsService";

export async function buildWhiteLabelDashboardSafe(workspaceId: string): Promise<WhiteLabelDashboardSafeDto | null> {
  if (!isTrustGraphEnabled() || !isTrustGraphWhiteLabelDashboardsEnabled()) {
    return null;
  }

  const ws = await prisma.trustgraphComplianceWorkspace.findUnique({
    where: { id: workspaceId },
  });
  if (!ws) return null;

  const branding = parseWorkspaceBranding(ws.branding);
  const openCases = await countOpenWorkspaceCases(workspaceId);

  const listingLinks = await prisma.trustgraphComplianceWorkspaceEntityLink.findMany({
    where: { workspaceId, entityType: "LISTING" },
    select: { entityId: true },
  });
  const listingIds = listingLinks.map((l) => l.entityId);
  let listingsVerifiedPercent: number | null = null;
  let declarationCompletePercent: number | null = null;

  if (listingIds.length > 0) {
    const cases = await prisma.verificationCase.findMany({
      where: { entityType: "LISTING", entityId: { in: listingIds } },
      select: { trustLevel: true, readinessLevel: true },
    });
    const verified = cases.filter((c) => c.trustLevel === "verified" || c.trustLevel === "high").length;
    listingsVerifiedPercent = Math.round((verified / Math.max(1, cases.length)) * 100);
    const ready = cases.filter((c) => c.readinessLevel === "ready").length;
    declarationCompletePercent = Math.round((ready / Math.max(1, cases.length)) * 100);
  }

  const slaRows = await prisma.trustgraphCaseSlaState.count({
    where: { workspaceId, state: "on_track" },
  });
  const slaTotal = await prisma.trustgraphCaseSlaState.count({ where: { workspaceId } });
  const slaOnTrackPercent = slaTotal > 0 ? Math.round((slaRows / slaTotal) * 100) : null;

  void recordPlatformEvent({
    eventType: "trustgraph_white_label_dashboard_generated",
    sourceModule: "trustgraph",
    entityType: "COMPLIANCE_WORKSPACE",
    entityId: workspaceId,
    payload: { metricKeys: ["openCases", "listingsVerifiedPercent"] },
  }).catch(() => {});

  const labels = getPhase7EnterpriseConfig().safeEnterpriseLabels;

  return {
    workspaceId: ws.id,
    workspaceName: ws.name,
    branding: {
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      displayLabel: branding.displayLabel ?? labels.portfolioReady,
    },
    metrics: {
      openCases,
      listingsVerifiedPercent,
      declarationCompletePercent,
      mortgageReadyPercent: null,
      slaOnTrackPercent,
    },
  };
}
