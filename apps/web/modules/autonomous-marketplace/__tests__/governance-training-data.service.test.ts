import { describe, expect, it } from "vitest";

import { buildGovernanceTrainingRow } from "../feedback/governance-training-data.service";
import type { GovernanceFeedbackInput, GovernanceFeedbackResult } from "../feedback/governance-feedback.types";

describe("governance-training-data.service", () => {
  it("maps fields deterministically and defaults revenue to zero", () => {
    const input: GovernanceFeedbackInput = {
      regionCode: "CA",
      actionType: "APPLY_PRICE_CHANGE",
      entityType: "short_term_listing",
      prediction: {
        governanceDisposition: "AUTO_EXECUTE",
        blocked: false,
        requiresHumanApproval: false,
        allowExecution: true,
        legalRiskScore: 12,
        legalRiskLevel: "MEDIUM",
        fraudRiskScore: 22,
        fraudRiskLevel: "HIGH",
        combinedRiskScore: 33,
        combinedRiskLevel: "HIGH",
      },
      truthEvents: [],
    };
    const result: GovernanceFeedbackResult = {
      label: "GOOD_EXECUTION",
      confidence: "HIGH",
      falsePositive: false,
      falseNegative: false,
      protectedRevenueEstimate: 0,
      leakedRevenueEstimate: 0,
      reasons: [],
      recommendedActions: [],
    };
    const row = buildGovernanceTrainingRow({ input, result });
    expect(row.regionCode).toBe("CA");
    expect(row.actionType).toBe("APPLY_PRICE_CHANGE");
    expect(row.entityType).toBe("short_term_listing");
    expect(row.legalRiskScore).toBe(12);
    expect(row.fraudRiskScore).toBe(22);
    expect(row.combinedRiskScore).toBe(33);
    expect(row.revenueImpactEstimate).toBe(0);
    expect(row.outcomeLabel).toBe("GOOD_EXECUTION");
  });

  it("uses revenueImpactEstimate when present", () => {
    const input: GovernanceFeedbackInput = {
      prediction: {
        governanceDisposition: "REQUIRE_APPROVAL",
        blocked: false,
        requiresHumanApproval: true,
        allowExecution: false,
        legalRiskScore: 0,
        legalRiskLevel: "LOW",
        fraudRiskScore: 0,
        fraudRiskLevel: "LOW",
        combinedRiskScore: 0,
        combinedRiskLevel: "LOW",
        revenueImpactEstimate: 250,
      },
      truthEvents: [],
    };
    const result: GovernanceFeedbackResult = {
      label: "INSUFFICIENT_DATA",
      confidence: "LOW",
      falsePositive: false,
      falseNegative: false,
      protectedRevenueEstimate: 0,
      leakedRevenueEstimate: 0,
      reasons: [],
      recommendedActions: [],
    };
    expect(buildGovernanceTrainingRow({ input, result }).revenueImpactEstimate).toBe(250);
  });
});
