import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { PortfolioDecisionType } from "./portfolio.types";
import { identifyRiskAssets } from "./portfolio-intelligence.service";
import { appendPortfolioAuditEvent } from "./portfolio-events.service";

const TAG = "[portfolio.ai]";

/**
 * Generates PROPOSED decisions only — never EXECUTED.
 * INVEST / EXIT always requireApproval=true (no auto-destructive execution).
 */
export async function generateProposedDecisions(portfolioId: string, actorUserId: string | null) {
  const portfolio = await prisma.lecipmBrokerPortfolio.findUnique({
    where: { id: portfolioId },
    include: {
      assetLinks: {
        include: {
          asset: true,
        },
      },
    },
  });
  if (!portfolio) throw new Error("Portfolio not found");

  const created: string[] = [];

  for (const link of portfolio.assetLinks) {
    const health = await prisma.lecipmPortfolioAssetHealthScore.findFirst({
      where: { assetId: link.assetId },
      orderBy: { createdAt: "desc" },
    });

    const score = health?.score ?? 50;
    let decisionType: PortfolioDecisionType = "HOLD";
    let rationale = "";
    let confidence = 0.55;

    if (score >= 78) {
      decisionType = "HOLD";
      rationale = `Asset "${link.asset.assetName}" shows stable health (score ${score}, band ${health?.band}). Recommendation: maintain position; monitor quarterly performance. Data: latest stored health snapshot.`;
      confidence = 0.72;
    } else if (score >= 60) {
      decisionType = "OPTIMIZE";
      rationale = `Asset "${link.asset.assetName}" is mid-tier (score ${score}). Recommendation: review rent roll / opex levers before exit. Explainable drivers: NOI margin and occupancy in performance layer.`;
      confidence = 0.66;
    } else {
      decisionType = "EXIT";
      rationale = `Asset "${link.asset.assetName}" underperforms (score ${score}). Recommendation: prepare disposition analysis — **human approval required** before any sale execution.`;
      confidence = 0.61;
    }

    const row = await prisma.lecipmBrokerPortfolioDecision.create({
      data: {
        portfolioId,
        assetId: link.assetId,
        decisionType,
        rationale,
        confidenceScore: confidence,
        requiresApproval: true,
        status: "PROPOSED",
      },
    });
    created.push(row.id);
  }

  const riskList = await identifyRiskAssets(portfolioId);
  if (riskList.length > 0) {
    const row = await prisma.lecipmBrokerPortfolioDecision.create({
      data: {
        portfolioId,
        assetId: null,
        decisionType: "INVEST",
        rationale: `Portfolio-level pattern: ${riskList.length} asset(s) flagged HIGH risk — consider diversifying into uncorrelated product / geography on next acquisition cycle. **No automatic capital deployment.**`,
        confidenceScore: 0.54,
        requiresApproval: true,
        status: "PROPOSED",
      },
    });
    created.push(row.id);
  }

  for (const id of created) {
    await appendPortfolioAuditEvent(portfolioId, {
      eventType: "DECISION_PROPOSED",
      summary: `Recommendation proposed (${id})`,
      actorUserId,
      metadataJson: { decisionId: id },
    });
  }

  logInfo(TAG, { portfolioId, count: created.length });
  return prisma.lecipmBrokerPortfolioDecision.findMany({
    where: { portfolioId, id: { in: created } },
    orderBy: { createdAt: "desc" },
  });
}
