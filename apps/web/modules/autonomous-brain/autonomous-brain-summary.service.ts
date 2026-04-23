import { getOutcomeTrackingSummary, listOptimizationOutcomesForDashboard } from "./autonomous-brain-outcomes.service";
import { buildPriorityQueue } from "./autonomous-brain-priority.service";
import { listLearningPatternsForDashboard } from "@/modules/learning/learning-dashboard.service";
import { listInvestmentOpportunitiesForDashboard } from "@/modules/investment/investment-dashboard.service";
import { listMarketplaceOptimizationProposals } from "@/modules/marketplace/marketplace-optimization-approval.service";

export type AutonomousBrainSummary = Awaited<ReturnType<typeof buildAutonomousBrainSummary>>;

/** Lightweight bundle for `/api/mobile/admin/autonomous-brain/summary`. */
export async function buildMobileAutonomousBrainSummary() {
  const [patterns, opportunities, proposals, priorities] = await Promise.all([
    listLearningPatternsForDashboard({ take: 5, sortBy: "impactScore", sortDir: "desc" }),
    listInvestmentOpportunitiesForDashboard({ take: 5 }),
    listMarketplaceOptimizationProposals({ take: 40 }),
    buildPriorityQueue(25),
  ]);

  const pendingImplementation = proposals.filter((p) => p.uiStatus === "APPROVED");
  const urgentItems = [
    ...pendingImplementation.map((p) => ({
      kind: "optimization_proposal" as const,
      id: p.id,
      label: `${p.domain}: ${p.action}`,
      reason: "Approved — waiting for controlled implementation.",
      advisoryOnly: true,
    })),
    ...priorities.slice(0, 8).map((p) => ({
      kind: "priority" as const,
      domain: p.domain,
      id: p.id,
      label: p.title,
      reason: p.whyNow,
      advisoryOnly: p.explainability.advisoryOnly,
    })),
  ].slice(0, 12);

  return {
    advisoryBanner:
      "Advisory-only: approvals are human-gated; metrics are illustrative snapshots.",
    generatedAt: new Date().toISOString(),
    topPatterns: patterns.slice(0, 5),
    topOpportunities: opportunities.slice(0, 5),
    topProposals: proposals.slice(0, 5),
    urgentItems,
  };
}

export async function buildAutonomousBrainSummary() {
  const [patterns, opportunities, proposals, priorities, outcomeSummary, outcomesSample] =
    await Promise.all([
      listLearningPatternsForDashboard({ take: 50, sortBy: "confidence", sortDir: "desc" }),
      listInvestmentOpportunitiesForDashboard({ take: 50 }),
      listMarketplaceOptimizationProposals({ take: 80 }),
      buildPriorityQueue(15),
      getOutcomeTrackingSummary(),
      listOptimizationOutcomesForDashboard(12),
    ]);

  const advisoryBanner =
    "Human review first: scores and proposals are advisory; no automated trading or mandate.";

  return {
    advisoryBanner,
    generatedAt: new Date().toISOString(),
    learning: {
      totalListed: patterns.length,
      patterns: patterns.slice(0, 10),
    },
    investment: {
      totalListed: opportunities.length,
      opportunities: opportunities.slice(0, 10),
    },
    marketplace: {
      proposals,
      counts: {
        proposed: proposals.filter((p) => p.uiStatus === "PROPOSED").length,
        approved: proposals.filter((p) => p.uiStatus === "APPROVED").length,
        rejected: proposals.filter((p) => p.uiStatus === "REJECTED").length,
        implemented: proposals.filter((p) => p.uiStatus === "IMPLEMENTED").length,
        expired: proposals.filter((p) => p.uiStatus === "EXPIRED").length,
      },
    },
    priorities: priorities.slice(0, 15),
    outcomes: {
      summary: outcomeSummary,
      recent: outcomesSample,
    },
  };
}
