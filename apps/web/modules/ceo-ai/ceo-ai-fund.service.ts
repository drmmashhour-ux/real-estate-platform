import { prisma } from "@/lib/db";
import { InvestmentFundStatus, InvestmentFundMode, InvestmentFundStrategy } from "@prisma/client";
import type { CeoDecisionProposal, CeoMarketSignals } from "@/modules/ceo-ai/ceo-ai.types";

/**
 * Proposes strategic fund management decisions for the AI CEO.
 */
export async function proposeFundDecisions(signals: CeoMarketSignals): Promise<CeoDecisionProposal[]> {
  const proposals: CeoDecisionProposal[] = [];

  // 1. Fetch active funds
  const funds = await prisma.investmentFund.findMany({
    where: { status: InvestmentFundStatus.ACTIVE },
    include: {
      performanceSnapshots: { orderBy: { timestamp: "desc" }, take: 1 }
    }
  });

  for (const fund of funds) {
    const latestSnapshot = fund.performanceSnapshots[0];

    // DECISION: Suggest Strategy Change
    // Heuristic: If risk is high (>0.8) and diversification is low (<0.4), suggest CAPITAL_PRESERVATION
    if (latestSnapshot && latestSnapshot.riskScore > 0.8 && latestSnapshot.diversificationScore < 0.4 && fund.strategyMode !== InvestmentFundStrategy.CAPITAL_PRESERVATION) {
      proposals.push({
        domain: "FUND",
        title: `De-risk strategy for ${fund.name}`,
        summary: `Shift ${fund.name} strategy to CAPITAL_PRESERVATION due to high concentration risk.`,
        rationale: `Current risk score is ${(latestSnapshot.riskScore * 100).toFixed(0)}% with low diversification (${(latestSnapshot.diversificationScore * 100).toFixed(0)}%).`,
        confidence: 0.72,
        impactEstimate: 0.05,
        requiresApproval: true,
        payload: {
          kind: "fund_strategy_change",
          fundId: fund.id,
          targetStrategy: InvestmentFundStrategy.CAPITAL_PRESERVATION,
        },
      });
    }

    // DECISION: Suggest Reallocation Trigger
    // Heuristic: If available capital is high (>30% of total) and demand index is healthy
    const availablePct = fund.availableCapital.div(fund.totalCapital).toNumber();
    if (availablePct > 0.3 && signals.demandIndex > 0.6) {
      proposals.push({
        domain: "FUND",
        title: `Trigger capital deployment for ${fund.name}`,
        summary: `Deploy unused capital ($${Number(fund.availableCapital).toLocaleString()}) to capture high-demand window.`,
        rationale: `Fund has ${(availablePct * 100).toFixed(0)}% available capital while market demand index is ${(signals.demandIndex * 100).toFixed(0)}%.`,
        confidence: 0.68,
        impactEstimate: 0.08,
        requiresApproval: true,
        payload: {
          kind: "fund_reallocation_trigger",
          fundId: fund.id,
          timing: "IMMEDIATE",
        },
      });
    }

    // DECISION: Suggest Rebalancing
    // Heuristic: Every 30 days if there are more than 3 deals
    const lastAllocation = await prisma.fundAllocation.findFirst({
      where: { fundId: fund.id },
      orderBy: { createdAt: "desc" },
    });
    const daysSinceLast = lastAllocation 
      ? (Date.now() - lastAllocation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      : 99;

    if (daysSinceLast > 30 && (await prisma.fundAllocation.count({ where: { fundId: fund.id } })) > 3) {
      proposals.push({
        domain: "FUND",
        title: `Rebalance portfolio for ${fund.name}`,
        summary: "Perform standard 30-day portfolio rebalancing to optimize allocations.",
        rationale: `Last allocation was ${daysSinceLast.toFixed(0)} days ago. Rebalancing ensures alignment with current market pricing and demand.`,
        confidence: 0.6,
        impactEstimate: 0.03,
        requiresApproval: true,
        payload: {
          kind: "fund_rebalance",
          fundId: fund.id,
        },
      });
    }
  }

  return proposals;
}
