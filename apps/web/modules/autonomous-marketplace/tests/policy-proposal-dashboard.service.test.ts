import { describe, expect, it } from "vitest";

import {
  buildPolicyProposalAdminSummary,
  buildPolicyProposalInvestorSummary,
} from "../dashboard/policy-proposal-dashboard.service";
import type { PolicyProposalReport } from "../proposals/policy-proposal.types";

function mockReport(partial: Partial<PolicyProposalReport>): PolicyProposalReport {
  return {
    generatedAt: "2026-01-01T00:00:00.000Z",
    proposals: [],
    summary: {
      totalProposals: 0,
      criticalCount: 0,
      highCount: 0,
    },
    ...partial,
  };
}

describe("policy-proposal-dashboard.service", () => {
  it("admin summary stable counts and threshold bucket", () => {
    const report = mockReport({
      proposals: [
        {
          id: "1",
          type: "THRESHOLD_ADJUSTMENT",
          title: "a",
          description: "",
          priority: "HIGH",
          confidence: "MEDIUM",
          target: { regionCode: "ca_qc" },
          recommendation: {},
          rationale: "",
          evidence: [{ sourceType: "feedback_summary", sourceKey: "s" }],
          impactEstimate: {},
        },
        {
          id: "2",
          type: "NEW_RULE",
          title: "b",
          description: "",
          priority: "CRITICAL",
          confidence: "HIGH",
          target: { actionType: "PAYMENT" },
          recommendation: {},
          rationale: "",
          evidence: [{ sourceType: "case_cluster", sourceKey: "c" }],
          impactEstimate: {},
        },
      ],
      summary: {
        totalProposals: 2,
        criticalCount: 1,
        highCount: 1,
        topPriorityTitle: "b",
      },
    });
    const admin = buildPolicyProposalAdminSummary(report);
    expect(admin.totalProposals).toBe(2);
    expect(admin.thresholdProposalCount).toBe(1);
    expect(admin.newRuleProposalCount).toBe(1);
    expect(admin.topAffectedRegion).toBe("ca_qc");
    expect(admin.topAffectedAction).toBe("PAYMENT");
    expect(admin.operationalSummary.length).toBeGreaterThan(20);
  });

  it("investor narrative stresses human review before activation", () => {
    const inv = buildPolicyProposalInvestorSummary(
      mockReport({
        proposals: [
          {
            id: "1",
            type: "THRESHOLD_ADJUSTMENT",
            title: "t",
            description: "",
            priority: "HIGH",
            confidence: "MEDIUM",
            target: {},
            recommendation: {},
            rationale: "",
            evidence: [],
            impactEstimate: {},
          },
        ],
        summary: { totalProposals: 1, criticalCount: 0, highCount: 1 },
      }),
    );
    expect(inv.narrative.toLowerCase()).toMatch(/human|approval|activate|automatic/);
    expect(inv.riskReductionOpportunityLevel).toMatch(/low|moderate|elevated/);
  });
});
