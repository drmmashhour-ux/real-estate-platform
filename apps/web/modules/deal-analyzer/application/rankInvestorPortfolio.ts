import { prisma } from "@/lib/db";
import { FSBO_HUB_REQUIRED_DOC_TYPES } from "@/lib/fsbo/seller-hub-doc-types";
import { isDealAnalyzerPortfolioEnabled } from "@/modules/deal-analyzer/config";
import {
  rankPortfolioItems,
  type PortfolioRankingInput,
} from "@/modules/deal-analyzer/infrastructure/services/portfolioRankingService";
import { logDealAnalyzerPhase2 } from "@/modules/deal-analyzer/infrastructure/services/phase2Logger";

function docRatio(docs: { docType: string; fileUrl: string | null }[]): number {
  const ok = FSBO_HUB_REQUIRED_DOC_TYPES.filter((t) => {
    const row = docs.find((d) => d.docType === t);
    return Boolean(row?.fileUrl?.trim());
  }).length;
  return ok / Math.max(1, FSBO_HUB_REQUIRED_DOC_TYPES.length);
}

export async function rankInvestorPortfolio(args: { listingIds: string[]; filters?: string[] }) {
  if (!isDealAnalyzerPortfolioEnabled()) {
    return { ok: false as const, error: "Portfolio ranking is disabled" };
  }

  const ids = args.listingIds.slice(0, 48);
  const filters = new Set(args.filters ?? []);

  const listings = await prisma.fsboListing.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      trustScore: true,
      riskScore: true,
      documents: { select: { docType: true, fileUrl: true } },
    },
  });

  const analyses = await prisma.dealAnalysis.findMany({
    where: { propertyId: { in: ids } },
    orderBy: { createdAt: "desc" },
  });
  const latest = new Map<string, (typeof analyses)[number]>();
  for (const a of analyses) {
    if (a.propertyId && !latest.has(a.propertyId)) {
      latest.set(a.propertyId, a);
    }
  }

  const inputs: PortfolioRankingInput[] = [];

  for (const l of listings) {
    const row = latest.get(l.id);
    const summary =
      row?.summary && typeof row.summary === "object" ? (row.summary as Record<string, unknown>) : {};
    const phase2 = typeof summary.phase2 === "object" && summary.phase2 != null ? (summary.phase2 as Record<string, unknown>) : {};
    const compSummary = phase2.comparablesSummary as { confidenceLevel?: string } | undefined;
    const scen = phase2.scenarioSummary as { confidence?: string } | undefined;
    const decision = phase2.decisionRefinement as { opportunity?: string } | undefined;

    const comparableConfidence =
      compSummary?.confidenceLevel === "high" ||
      compSummary?.confidenceLevel === "medium" ||
      compSummary?.confidenceLevel === "low"
        ? (compSummary.confidenceLevel as "low" | "medium" | "high")
        : null;
    const scenarioConfidence =
      scen?.confidence === "high" || scen?.confidence === "medium" || scen?.confidence === "low"
        ? (scen.confidence as "low" | "medium" | "high")
        : null;

    const scoreComponents = summary.components as { readinessComponent?: number } | undefined;

    inputs.push({
      listingId: l.id,
      investmentScore: row?.investmentScore ?? 0,
      riskScore: row?.riskScore ?? 50,
      confidenceScore: row?.confidenceScore ?? null,
      trustScore: l.trustScore,
      readinessSignal:
        typeof scoreComponents?.readinessComponent === "number" ? scoreComponents.readinessComponent : 50,
      comparableConfidence,
      scenarioConfidence,
      documentCompleteness: docRatio(l.documents),
      isBnhubCandidate: decision?.opportunity === "bnhub_candidate" || Boolean(phase2.bnhub),
    });
  }

  const ranked = rankPortfolioItems(inputs, filters);

  logDealAnalyzerPhase2("deal_analyzer_portfolio_rank", {
    listingCount: String(ids.length),
    resultCount: String(ranked.length),
    trigger: "rankInvestorPortfolio",
  });

  return { ok: true as const, ranked };
}
