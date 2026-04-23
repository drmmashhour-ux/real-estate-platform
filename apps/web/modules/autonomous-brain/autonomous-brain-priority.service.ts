/**
 * Cross-domain prioritization — advisory ranking for operator attention (no auto-execution).
 */
import type { LearningPattern } from "@prisma/client";

import { prisma } from "@/lib/db";
import { AUTONOMY_DOMAINS } from "@/modules/autonomy/autonomy-types";
import type { InvestmentOpportunityRow } from "@/modules/investment/investment-dashboard.service";
import { formatExpectedRoiBand } from "@/modules/investment/investment-opportunity-formatters";
import type { MarketplaceOptimizationProposalRow } from "@/modules/marketplace/marketplace-optimization-approval.service";

export type PriorityDomain = "learning_pattern" | "investment_opportunity" | "optimization_proposal";

export type PriorityQueueItem = {
  domain: PriorityDomain;
  id: string;
  title: string;
  /** Normalized priority score (higher = attend first). */
  priorityScore: number;
  /** Plain-language rationale for ranking. */
  whyNow: string;
  /** Qualitative expected value statement. */
  expectedValue: string;
  suggestedNextStep: string;
  explainability: {
    dataSources: string[];
    confidence: number | null;
    advisoryOnly: boolean;
    prioritizationFactors: string[];
  };
};

type PatternShape = Pick<
  LearningPattern,
  "id" | "pattern" | "confidence" | "impactScore" | "sampleSize"
>;

/** Exported for tests — deterministic ranking without DB. */
export function computeLearningPatternPriority(p: PatternShape): number {
  const evidence = Math.min(1, p.sampleSize / 50);
  const urgency = p.confidence >= 0.75 ? 1.05 : 1;
  return p.impactScore * p.confidence * evidence * urgency;
}

export function computeInvestmentPriority(o: InvestmentOpportunityRow): number {
  const scoreNorm = Math.min(1, Math.max(0, o.score / 100));
  const riskPenalty =
    o.riskLevel === "HIGH" ? 0.85
    : o.riskLevel === "MEDIUM" ? 0.93
    : 1;
  return scoreNorm * riskPenalty * (o.expectedROI > 0 ? 1.05 : 1);
}

export function computeOptimizationPriority(x: MarketplaceOptimizationProposalRow): number {
  const impact = x.impactEstimate ?? x.confidence;
  const approvalFriction = x.requiresApproval ? 0.92 : 1.08;
  const urgency =
    x.uiStatus === "PROPOSED" && x.requiresApproval ? 1.08
    : x.uiStatus === "APPROVED" ? 1.12
    : 1;
  return impact * x.confidence * approvalFriction * urgency;
}

export async function buildPriorityQueue(take = 25): Promise<PriorityQueueItem[]> {
  const [patterns, opportunities, proposals] = await Promise.all([
    prisma.learningPattern.findMany({
      orderBy: [{ impactScore: "desc" }, { confidence: "desc" }],
      take: 60,
      select: {
        id: true,
        pattern: true,
        confidence: true,
        impactScore: true,
        sampleSize: true,
      },
    }),
    prisma.investmentOpportunity.findMany({
      orderBy: [{ score: "desc" }],
      take: 60,
      select: {
        id: true,
        listingId: true,
        score: true,
        expectedROI: true,
        riskLevel: true,
        recommendedInvestmentMajor: true,
        rationaleJson: true,
        createdAt: true,
        listing: { select: { title: true } },
      },
    }),
    prisma.autonomyDecision.findMany({
      where: { domain: { in: [...AUTONOMY_DOMAINS] } },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        domain: true,
        action: true,
        rationale: true,
        confidence: true,
        impactEstimate: true,
        requiresApproval: true,
        status: true,
        payloadJson: true,
        baselineMetricsJson: true,
        createdAt: true,
        approvedAt: true,
        appliedAt: true,
        approvedByUserId: true,
      },
    }),
  ]);

  const mappedProposals: MarketplaceOptimizationProposalRow[] = proposals.map((r) => {
    const uiStatus =
      r.status === "AUTO_APPLIED" || r.status === "APPLIED" ? "IMPLEMENTED"
      : r.status === "EXPIRED" ? "EXPIRED"
      : r.status === "PROPOSED" || r.status === "APPROVED" || r.status === "REJECTED" ?
        r.status
      : "REJECTED";
    return { ...r, uiStatus };
  });

  const oppRows: InvestmentOpportunityRow[] = opportunities.map((r) => ({
    id: r.id,
    listingId: r.listingId,
    score: r.score,
    expectedROI: r.expectedROI,
    riskLevel: r.riskLevel,
    recommendedInvestmentMajor: r.recommendedInvestmentMajor,
    rationaleJson: r.rationaleJson,
    createdAt: r.createdAt,
    listingTitle: r.listing?.title ?? null,
  }));

  const learningItems: PriorityQueueItem[] = patterns.map((p) => {
    const priorityScore = computeLearningPatternPriority(p);
    const factors = [
      `impactScore=${p.impactScore.toFixed(3)}`,
      `confidence=${p.confidence.toFixed(3)}`,
      `sampleSize=${p.sampleSize}`,
    ];
    return {
      domain: "learning_pattern",
      id: p.id,
      title: p.pattern.slice(0, 120),
      priorityScore,
      whyNow:
        p.sampleSize >= 20 ?
          "Enough closed-loop samples make this pattern statistically visible."
        : "Emerging signal worth monitoring before broader rollout.",
      expectedValue:
        `Potential lift tied to impact score ${p.impactScore.toFixed(2)} with confidence ${(p.confidence * 100).toFixed(0)}%.`,
      suggestedNextStep: "Validate with operators and align playbook updates (advisory).",
      explainability: {
        dataSources: ["DealOutcome aggregates → LearningPattern library"],
        confidence: p.confidence,
        advisoryOnly: true,
        prioritizationFactors: factors,
      },
    };
  });

  const investItems: PriorityQueueItem[] = oppRows.map((o) => {
    const priorityScore = computeInvestmentPriority(o);
    const factors = [
      `score=${o.score.toFixed(2)}`,
      `risk=${o.riskLevel}`,
      `roiBand=${formatExpectedRoiBand(o.expectedROI)}`,
    ];
    return {
      domain: "investment_opportunity",
      id: o.id,
      title: `${o.listingTitle ?? "Listing"} · advisory rank`,
      priorityScore,
      whyNow:
        o.score >= 70 ?
          "High composite score versus peer listings in the latest snapshot."
        : "Interesting trade-off profile for manual broker review.",
      expectedValue: `ROI band ${formatExpectedRoiBand(o.expectedROI)} — sizing hint ${o.recommendedInvestmentMajor ?? "n/a"} (not an order).`,
      suggestedNextStep: "Broker reviews listing fundamentals; rationale JSON is supporting context only.",
      explainability: {
        dataSources: ["CRM listing snapshot → InvestmentOpportunity"],
        confidence: Math.min(1, Math.max(0, o.score / 100)),
        advisoryOnly: true,
        prioritizationFactors: factors,
      },
    };
  });

  const optItems: PriorityQueueItem[] = mappedProposals
    .filter((x) => x.uiStatus === "PROPOSED" || x.uiStatus === "APPROVED")
    .map((x) => {
      const priorityScore = computeOptimizationPriority(x);
      const factors = [
        `domain=${x.domain}`,
        `impactEst=${(x.impactEstimate ?? x.confidence).toFixed(3)}`,
        `requiresApproval=${x.requiresApproval}`,
        `uiStatus=${x.uiStatus}`,
      ];
      return {
        domain: "optimization_proposal" as const,
        id: x.id,
        title: `${x.domain}: ${x.action}`,
        priorityScore,
        whyNow:
          x.uiStatus === "APPROVED" ?
            "Approved and waiting for controlled implementation."
          : "New optimization candidate requiring human judgment.",
        expectedValue: `Estimated marketplace impact ${(x.impactEstimate ?? x.confidence).toFixed(2)} (model estimate).`,
        suggestedNextStep:
          x.requiresApproval && x.uiStatus === "PROPOSED" ?
            "Review payload, approve or reject with a note."
          : "Implement during a monitored window or reject with rationale.",
        explainability: {
          dataSources: [
            "Autonomy engine → AutonomyDecision (baseline metrics snapshot attached to row)",
          ],
          confidence: x.confidence,
          advisoryOnly: x.requiresApproval,
          prioritizationFactors: factors,
        },
      };
    });

  const merged = [...learningItems, ...investItems, ...optItems];
  merged.sort((a, b) => b.priorityScore - a.priorityScore);
  return merged.slice(0, take);
}
