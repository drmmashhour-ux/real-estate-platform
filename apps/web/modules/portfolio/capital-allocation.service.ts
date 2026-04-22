import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import type { AllocationRow } from "./portfolio.types";
import { rankAssets } from "./portfolio-intelligence.service";
import { appendPortfolioAuditEvent } from "./portfolio-events.service";

const TAG = "[portfolio.capital]";

/** Non-destructive proposal only — stored for human review. */
export async function generateAllocation(portfolioId: string, totalBudget: number, actorUserId: string | null) {
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) throw new Error("Budget must be positive");

  const ranked = await rankAssets(portfolioId);
  if (ranked.length === 0) throw new Error("No assets in portfolio");

  const weights = ranked.map((r) => Math.max(0.05, r.score / 100));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const rows: AllocationRow[] = ranked.map((r, i) => {
    const w = weights[i]! / sumW;
    const proposedAmount = Math.round(totalBudget * w * 100) / 100;
    return {
      assetId: r.assetId,
      assetName: r.assetName,
      proposedAmount,
      weight: Math.round(w * 1000) / 1000,
      basis: `Health score ${r.score} (${r.band}), risk ${r.riskLevel}; proportional weight after score normalization.`,
    };
  });

  const allocationJson = {
    generatedAt: new Date().toISOString(),
    totalBudget,
    rows,
    explainability:
      "Weights increase with asset health score; floor 5% per linked asset to avoid zero allocation. No execution — proposal only.",
  } satisfies Record<string, unknown>;

  const proposal = await prisma.lecipmCapitalAllocationProposal.create({
    data: {
      portfolioId,
      totalBudget,
      allocationJson: allocationJson as Prisma.InputJsonValue,
      rationale:
        "Capital spread by relative health scores to favour stronger / lower-risk positions; requires human approval before any transfer.",
    },
  });

  await appendPortfolioAuditEvent(portfolioId, {
    eventType: "CAPITAL_ALLOCATION_PROPOSED",
    summary: `Allocation proposal ${proposal.id} (budget ${totalBudget})`,
    actorUserId,
    metadataJson: { proposalId: proposal.id },
  });

  logInfo(TAG, { portfolioId, proposalId: proposal.id });
  return { proposal, allocationJson };
}
