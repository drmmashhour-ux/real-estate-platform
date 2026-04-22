import { describe, expect, it } from "vitest";

import { dedupePolicyProposals, sortPolicyProposals } from "../proposals/policy-proposal-helpers.service";
import { buildPolicyProposalReport } from "../proposals/policy-proposal-report.service";
import type { PolicyProposal } from "../proposals/policy-proposal.types";

describe("policy-proposal-report.service", () => {
  it("dedupes similar proposals and sorts CRITICAL above LOW", () => {
    const a: PolicyProposal = {
      id: "a",
      type: "THRESHOLD_ADJUSTMENT",
      title: "t1",
      description: "d",
      priority: "LOW",
      confidence: "LOW",
      target: { metricKey: "combinedRiskHigh" },
      recommendation: {},
      rationale: "r",
      evidence: [{ sourceType: "feedback_summary", sourceKey: "s" }],
      impactEstimate: {},
    };
    const b: PolicyProposal = {
      ...a,
      id: "b",
      priority: "CRITICAL",
      confidence: "HIGH",
    };
    const deduped = dedupePolicyProposals([a, b]);
    expect(deduped.length).toBe(1);
    expect(deduped[0].priority).toBe("CRITICAL");

    const sorted = sortPolicyProposals([
      { ...a, id: "z", priority: "LOW" },
      { ...b, id: "y", priority: "CRITICAL" },
    ]);
    expect(sorted[0].priority).toBe("CRITICAL");
  });

  it("buildPolicyProposalReport returns summary counts", () => {
    const r = buildPolicyProposalReport({
      performanceSummary: {
        totalCases: 12,
        falsePositiveRate: 0.06,
        falseNegativeRate: 0.18,
        protectedRevenueEstimate: 0,
        leakedRevenueEstimate: 900,
      },
    });
    expect(r.summary.totalProposals).toBe(r.proposals.length);
    expect(r.summary.criticalCount + r.summary.highCount).toBeGreaterThanOrEqual(0);
  });
});
