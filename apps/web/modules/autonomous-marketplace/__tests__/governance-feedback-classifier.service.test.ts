import { describe, expect, it } from "vitest";

import { classifyGovernanceOutcome } from "../feedback/governance-feedback-classifier.service";
import type { GovernancePredictionSnapshot } from "../feedback/governance-feedback.types";

function basePrediction(over: Partial<GovernancePredictionSnapshot> = {}): GovernancePredictionSnapshot {
  return {
    governanceDisposition: "AUTO_EXECUTE",
    blocked: false,
    requiresHumanApproval: false,
    allowExecution: true,
    legalRiskScore: 10,
    legalRiskLevel: "LOW",
    fraudRiskScore: 10,
    fraudRiskLevel: "LOW",
    combinedRiskScore: 10,
    combinedRiskLevel: "LOW",
    ...over,
  };
}

describe("governance-feedback-classifier.service", () => {
  it("blocked + fraud confirmed => GOOD_BLOCK", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({ blocked: true, revenueImpactEstimate: 100 }),
      truthEvents: [{ type: "fraud_confirmed", occurredAt: "2026-04-01T12:00:00.000Z" }],
    });
    expect(r.label).toBe("GOOD_BLOCK");
    expect(r.falsePositive).toBe(false);
  });

  it("blocked + fraud cleared => BAD_BLOCK", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({ blocked: true }),
      truthEvents: [{ type: "fraud_cleared", occurredAt: "2026-04-01T12:00:00.000Z" }],
    });
    expect(r.label).toBe("BAD_BLOCK");
    expect(r.falsePositive).toBe(true);
  });

  it("approval + rejected + harmful => GOOD_APPROVAL", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({
        blocked: false,
        requiresHumanApproval: true,
        allowExecution: false,
        governanceDisposition: "REQUIRE_APPROVAL",
      }),
      truthEvents: [
        { type: "manual_approval_rejected", occurredAt: "2026-04-01T12:00:00.000Z" },
        { type: "chargeback", occurredAt: "2026-04-02T12:00:00.000Z", amount: 50 },
      ],
    });
    expect(r.label).toBe("GOOD_APPROVAL");
  });

  it("approval + granted + harmful => BAD_APPROVAL", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({
        blocked: false,
        requiresHumanApproval: true,
        allowExecution: false,
      }),
      truthEvents: [
        { type: "manual_approval_granted", occurredAt: "2026-04-01T12:00:00.000Z" },
        { type: "refund", occurredAt: "2026-04-02T12:00:00.000Z", amount: 80 },
      ],
    });
    expect(r.label).toBe("BAD_APPROVAL");
    expect(r.falseNegative).toBe(true);
  });

  it("execution allowed + success + clean => GOOD_EXECUTION", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({
        blocked: false,
        requiresHumanApproval: false,
        allowExecution: true,
      }),
      truthEvents: [{ type: "execution_succeeded", occurredAt: "2026-04-01T12:00:00.000Z" }],
    });
    expect(r.label).toBe("GOOD_EXECUTION");
  });

  it("execution allowed + chargeback => BAD_EXECUTION", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({
        allowExecution: true,
      }),
      truthEvents: [
        { type: "execution_succeeded", occurredAt: "2026-04-01T12:00:00.000Z" },
        { type: "chargeback", occurredAt: "2026-04-02T12:00:00.000Z", amount: 120 },
      ],
    });
    expect(r.label).toBe("BAD_EXECUTION");
    expect(r.falseNegative).toBe(true);
  });

  it("detects missed risk on chargeback after allowed execution", () => {
    const prediction = basePrediction({
      governanceDisposition: "ALLOW_PREVIEW",
      blocked: false,
      requiresHumanApproval: false,
      allowExecution: true,
      legalRiskScore: 10,
      legalRiskLevel: "LOW",
      fraudRiskScore: 20,
      fraudRiskLevel: "LOW",
      combinedRiskScore: 15,
      combinedRiskLevel: "LOW",
    });

    const truthEvents = [
      {
        type: "chargeback" as const,
        occurredAt: new Date().toISOString(),
        amount: 500,
      },
    ];

    const result = classifyGovernanceOutcome({
      prediction,
      truthEvents,
    });

    expect(result.label).toBe("MISSED_RISK");
    expect(result.falseNegative).toBe(true);
  });

  it("low restriction + harmful event => MISSED_RISK", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({
        blocked: false,
        requiresHumanApproval: false,
        allowExecution: false,
      }),
      truthEvents: [{ type: "payout_reversal", occurredAt: "2026-04-02T12:00:00.000Z", amount: 40 }],
    });
    expect(r.label).toBe("MISSED_RISK");
    expect(r.falseNegative).toBe(true);
  });

  it("unknown / empty evidence => INSUFFICIENT_DATA", () => {
    const r = classifyGovernanceOutcome({
      prediction: basePrediction({ blocked: true }),
      truthEvents: [],
    });
    expect(r.label).toBe("INSUFFICIENT_DATA");
  });
});
