import { describe, expect, it, vi } from "vitest";
import type { PolicyContext } from "../../policy-context";
import {
  evaluateQuebecCompliancePublishRule,
  evaluateQuebecComplianceReadinessWarningRule,
  QUEBEC_COMPLIANCE_RULE_CODE,
  QUEBEC_COMPLIANCE_READINESS_RULE_CODE,
} from "../quebec-compliance.rules";

vi.mock("@/config/feature-flags", () => ({
  complianceFlags: {
    quebecComplianceV1: true,
    complianceAutoBlockV1: true,
  },
}));

function baseCtx(partial: Partial<PolicyContext> = {}): PolicyContext {
  return {
    action: {
      id: "a1",
      title: "Test",
      humanReadableSummary: "Test",
      opportunityId: "o1",
      target: { type: "fsbo_listing", id: "L1" },
      metadata: {},
    },
    observation: {
      id: "obs",
      target: { type: "fsbo_listing", id: "L1" },
      signals: [],
      aggregates: {},
      facts: {},
      builtAt: new Date().toISOString(),
    },
    autonomyMode: "OFF",
    targetActive: true,
    activePromotionCount: 0,
    priceDeltaTodayPct: 0,
    ...partial,
  } as PolicyContext;
}

describe("evaluateQuebecCompliancePublishRule", () => {
  it("blocks when compliance snapshot disallows publishing", () => {
    const ctx = baseCtx({
      quebecCompliance: {
        readinessScore: 40,
        allowed: false,
        blockingIssueIds: ["qc_listing_property_basic_data_present"],
        reasonsPreview: ["Price, property type, and a valid address are required."],
      },
    });
    const out = evaluateQuebecCompliancePublishRule(ctx);
    expect(out.ruleCode).toBe(QUEBEC_COMPLIANCE_RULE_CODE);
    expect(out.result).toBe("blocked");
    expect(out.reason ?? "").toContain("cannot be published");
    expect(out.metadata?.action).toBe("block_publish");
    expect(out.metadata?.domain).toBe("legal_compliance");
  });

  it("passes when compliance is allowed", () => {
    const ctx = baseCtx({
      quebecCompliance: {
        readinessScore: 95,
        allowed: true,
        blockingIssueIds: [],
        reasonsPreview: [],
      },
    });
    const out = evaluateQuebecCompliancePublishRule(ctx);
    expect(out.result).toBe("passed");
  });
});

describe("evaluateQuebecComplianceReadinessWarningRule", () => {
  it("warns when readiness is below threshold", () => {
    const ctx = baseCtx({
      quebecCompliance: {
        readinessScore: 70,
        allowed: true,
        blockingIssueIds: [],
        reasonsPreview: [],
      },
    });
    const out = evaluateQuebecComplianceReadinessWarningRule(ctx);
    expect(out.ruleCode).toBe(QUEBEC_COMPLIANCE_READINESS_RULE_CODE);
    expect(out.result).toBe("warning");
  });

  it("passes when readiness meets threshold", () => {
    const ctx = baseCtx({
      quebecCompliance: {
        readinessScore: 85,
        allowed: true,
        blockingIssueIds: [],
        reasonsPreview: [],
      },
    });
    const out = evaluateQuebecComplianceReadinessWarningRule(ctx);
    expect(out.result).toBe("passed");
  });
});
