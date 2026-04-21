import type { PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { listAccessibleAssetIds } from "./portfolio-access";
import { buildPortfolioIntelligence, getOrCreatePortfolioPolicy } from "./portfolio-intelligence.service";
import type { ObjectiveMode, PortfolioReportPayload } from "./portfolio.types";

export async function buildPortfolioSummaryReport(userId: string, role: PlatformRole): Promise<PortfolioReportPayload> {
  const bundle = await buildPortfolioIntelligence(userId, role);
  const policy = await getOrCreatePortfolioPolicy(userId);

  const assetIds = await listAccessibleAssetIds(userId, role);
  const pendingPlans = await prisma.assetManagerPlan.count({
    where: { assetId: { in: assetIds }, status: { in: ["PROPOSED", "DRAFT"] } },
  });

  const payload: PortfolioReportPayload = {
    generatedAt: new Date().toISOString(),
    policyMode: bundle.overview.policyMode,
    confidenceDisclaimer:
      "Figures derive from operational signals available to LECIPM — estimates are labeled; verified evidence takes precedence.",
    healthSummary: {
      totalAssets: bundle.overview.totalAssets,
      averageBand: bundle.overview.averageHealthBand,
      criticalCount: bundle.overview.criticalCount,
      watchlistCount: bundle.overview.watchlistCount,
    },
    priorityReport: {
      top: bundle.priorities.slice(0, 15),
    },
    capitalProposal: bundle.capitalAllocation as unknown as Record<string, unknown>,
    watchlistReport: {
      entries: bundle.watchlist,
    },
    executiveMemo: [
      bundle.overview.capitalNeedSummary,
      bundle.commonThemes.length ? `Themes: ${bundle.commonThemes.join("; ")}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
    pendingApprovalsSummary:
      pendingPlans > 0
        ? `${pendingPlans} asset manager plan(s) awaiting approval/rejection (policy mode ${policy.autonomyMode}).`
        : "No pending asset manager approvals in accessible scope.",
  };

  return payload;
}

export async function buildPortfolioReportPack(input: {
  userId: string;
  role: PlatformRole;
  objectiveMode?: ObjectiveMode;
}) {
  const summary = await buildPortfolioSummaryReport(input.userId, input.role);
  return {
    summary,
    objectiveMode: input.objectiveMode ?? ("BALANCED" as ObjectiveMode),
    formats: ["json"] as const,
    pdfReady: false,
  };
}
