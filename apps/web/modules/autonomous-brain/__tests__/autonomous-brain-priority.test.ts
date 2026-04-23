import { describe, expect, it } from "vitest";

import {
  computeInvestmentPriority,
  computeLearningPatternPriority,
  computeOptimizationPriority,
} from "../autonomous-brain-priority.service";
import type { MarketplaceOptimizationProposalRow } from "@/modules/marketplace/marketplace-optimization-approval.service";
import type { InvestmentOpportunityRow } from "@/modules/investment/investment-dashboard.service";

describe("autonomous-brain priority ranking", () => {
  it("ranks higher confidence + impact learning patterns above noisy low-sample ones", () => {
    const strong = computeLearningPatternPriority({
      id: "a",
      pattern: "x",
      confidence: 0.9,
      impactScore: 0.8,
      sampleSize: 40,
    });
    const weak = computeLearningPatternPriority({
      id: "b",
      pattern: "y",
      confidence: 0.5,
      impactScore: 0.3,
      sampleSize: 3,
    });
    expect(strong).toBeGreaterThan(weak);
  });

  it("prefers higher-scoring investment rows when risk is equal", () => {
    const base = {
      id: "1",
      listingId: "l1",
      expectedROI: 0.1,
      riskLevel: "LOW",
      recommendedInvestmentMajor: 100,
      rationaleJson: null,
      createdAt: new Date(),
      listingTitle: "A",
    } satisfies InvestmentOpportunityRow;

    const hi = computeInvestmentPriority({ ...base, score: 90 });
    const lo = computeInvestmentPriority({ ...base, score: 40 });
    expect(hi).toBeGreaterThan(lo);
  });

  it("surfaces approved optimizations higher than cold proposals when impact held equal", () => {
    const base = {
      id: "d1",
      domain: "MATCHING",
      action: "tune",
      rationale: "r",
      confidence: 0.7,
      impactEstimate: 0.5,
      requiresApproval: true,
      payloadJson: null,
      baselineMetricsJson: null,
      createdAt: new Date(),
      approvedAt: null,
      appliedAt: null,
      approvedByUserId: null,
      status: "PROPOSED",
    };

    const proposed: MarketplaceOptimizationProposalRow = {
      ...base,
      uiStatus: "PROPOSED",
    };
    const approved: MarketplaceOptimizationProposalRow = {
      ...base,
      status: "APPROVED",
      uiStatus: "APPROVED",
    };

    expect(computeOptimizationPriority(approved)).toBeGreaterThanOrEqual(
      computeOptimizationPriority(proposed)
    );
  });
});
