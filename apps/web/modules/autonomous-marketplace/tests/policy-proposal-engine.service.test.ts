import { describe, expect, it } from "vitest";

import { generatePolicyProposals } from "../proposals/policy-proposal-engine.service";
import type { PolicyProposalInput } from "../proposals/policy-proposal.types";

describe("policy-proposal-engine generatePolicyProposals", () => {
  it("threshold adjustment when falseNegativeRate and leakage are materially high", () => {
    const input: PolicyProposalInput = {
      performanceSummary: {
        totalCases: 12,
        falsePositiveRate: 0.06,
        falseNegativeRate: 0.18,
        protectedRevenueEstimate: 100,
        leakedRevenueEstimate: 900,
      },
    };
    const p = generatePolicyProposals(input);
    expect(p.some((x) => x.type === "THRESHOLD_ADJUSTMENT")).toBe(true);
    expect(p.every((x) => x.evidence.length > 0)).toBe(true);
  });

  it("NEW_RULE when HIGH cluster repeats harmful outcomes without affectedRuleIds", () => {
    const input: PolicyProposalInput = {
      clusters: [
        {
          clusterKey: "x",
          caseCount: 3,
          falsePositiveCount: 0,
          falseNegativeCount: 3,
          leakedRevenueEstimate: 120,
          protectedRevenueEstimate: 0,
          affectedRuleIds: [],
          severity: "HIGH",
          fingerprint: {
            regionCode: "ca_qc",
            actionType: "PAYOUT",
            outcomeLabel: "MISSED_RISK",
          },
        },
      ],
    };
    const p = generatePolicyProposals(input);
    expect(p.some((x) => x.type === "NEW_RULE" && x.title.includes("blind"))).toBe(true);
  });

  it("RULE_ORDER_REVIEW when clusters cite rules and drift worsens FN/FP", () => {
    const input: PolicyProposalInput = {
      clusters: [
        {
          clusterKey: "r1",
          caseCount: 2,
          falsePositiveCount: 0,
          falseNegativeCount: 2,
          leakedRevenueEstimate: 50,
          protectedRevenueEstimate: 0,
          affectedRuleIds: ["gate_block_v1"],
          severity: "CRITICAL",
          fingerprint: { outcomeLabel: "BAD_EXECUTION" },
        },
      ],
      driftAlerts: [
        {
          alertKey: "d1",
          dimension: "policyDecision",
          dimensionValue: "harmful_rate",
          metric: "falseNegativeRate",
          baselineValue: 0.1,
          currentValue: 0.22,
          delta: 0.12,
          severity: "WARNING",
        },
      ],
    };
    const p = generatePolicyProposals(input);
    expect(p.some((x) => x.type === "RULE_ORDER_REVIEW")).toBe(true);
  });

  it("REGION_POLICY_REVIEW from region drift", () => {
    const input: PolicyProposalInput = {
      driftAlerts: [
        {
          alertKey: "reg",
          dimension: "regionCode",
          dimensionValue: "ca_on",
          metric: "falseNegativeRate",
          baselineValue: 0.08,
          currentValue: 0.19,
          delta: 0.11,
          severity: "CRITICAL",
        },
      ],
    };
    const p = generatePolicyProposals(input);
    expect(p.some((x) => x.type === "REGION_POLICY_REVIEW")).toBe(true);
  });

  it("ACTION_POLICY_REVIEW from action drift on FN metric", () => {
    const input: PolicyProposalInput = {
      driftAlerts: [
        {
          alertKey: "act",
          dimension: "actionType",
          dimensionValue: "PAYMENT",
          metric: "falseNegativeRate",
          baselineValue: 0.05,
          currentValue: 0.16,
          delta: 0.11,
          severity: "WARNING",
        },
      ],
    };
    const p = generatePolicyProposals(input);
    expect(p.some((x) => x.type === "ACTION_POLICY_REVIEW")).toBe(true);
  });

  it("ENTITY_POLICY_REVIEW when entity type repeats harm", () => {
    const input: PolicyProposalInput = {
      clusters: [
        {
          clusterKey: "e1",
          caseCount: 2,
          falsePositiveCount: 0,
          falseNegativeCount: 2,
          leakedRevenueEstimate: 80,
          protectedRevenueEstimate: 0,
          affectedRuleIds: [],
          severity: "HIGH",
          fingerprint: {
            entityType: "booking",
            outcomeLabel: "MISSED_RISK",
          },
        },
      ],
    };
    const p = generatePolicyProposals(input);
    expect(p.some((x) => x.type === "ENTITY_POLICY_REVIEW")).toBe(true);
  });

  it("never throws on garbage", () => {
    expect(() => generatePolicyProposals({} as PolicyProposalInput)).not.toThrow();
  });
});
