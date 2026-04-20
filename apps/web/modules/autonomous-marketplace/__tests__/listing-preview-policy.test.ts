import { describe, expect, it } from "vitest";
import { autonomyConfig } from "../config/autonomy.config";
import { listingPreviewPolicyRuleEvaluators } from "../policy/listing-preview-policy-rules";
import { evaluateListingPreviewPolicyFromContext } from "../policy/policy-engine";
import type { PolicyContext } from "../policy/policy-context";

function baseCtx(overrides: Partial<PolicyContext> = {}): PolicyContext {
  return {
    action: {
      id: "a1",
      type: "UPDATE_LISTING_COPY",
      target: { type: "fsbo_listing", id: "list-1" },
      confidence: 0.8,
      risk: "LOW",
      title: "",
      explanation: "",
      humanReadableSummary: "",
      metadata: {},
      suggestedAt: new Date().toISOString(),
      sourceDetectorId: "det",
      opportunityId: "opp",
    },
    observation: {
      id: "obs",
      target: { type: "fsbo_listing", id: "list-1" },
      signals: [],
      aggregates: {},
      facts: {},
      builtAt: new Date().toISOString(),
    },
    autonomyMode: "OFF",
    targetActive: true,
    activePromotionCount: 0,
    priceDeltaTodayPct: 0,
    ...overrides,
  };
}

describe("listing preview policy (core rules + certificate readiness)", () => {
  it("evaluates one rule result per registered rule", () => {
    const d = evaluateListingPreviewPolicyFromContext(baseCtx());
    expect(d.ruleResults).toHaveLength(listingPreviewPolicyRuleEvaluators.length);
    expect(listingPreviewPolicyRuleEvaluators).toHaveLength(5);
  });

  it("blocks APPLY_PRICE_CHANGE when delta exceeds guardrail", () => {
    const ctx = baseCtx({
      autonomyMode: "SAFE_AUTOPILOT",
      action: {
        ...baseCtx().action,
        type: "APPLY_PRICE_CHANGE",
        metadata: { deltaPct: autonomyConfig.pricing.maxIncreasePctPerRun + 2 },
      },
    });
    const d = evaluateListingPreviewPolicyFromContext(ctx);
    const pricing = d.ruleResults.find((r) => r.ruleCode === "pricing_guardrail");
    expect(pricing?.result).toBe("blocked");
    expect(["BLOCK", "ALLOW_WITH_APPROVAL"]).toContain(d.disposition);
  });

  it("blocks START_PROMOTION when listing not active", () => {
    const ctx = baseCtx({
      targetActive: false,
      action: {
        ...baseCtx().action,
        type: "START_PROMOTION",
      },
    });
    const d = evaluateListingPreviewPolicyFromContext(ctx);
    const activeRule = d.ruleResults.find((r) => r.ruleCode === "target_active");
    expect(activeRule?.result).toBe("blocked");
    expect(d.disposition).toBe("BLOCK");
  });

  it("blocks duplicate START_PROMOTION when promotion already active", () => {
    const ctx = baseCtx({
      activePromotionCount: autonomyConfig.promotions.maxActivePerListing,
      action: {
        ...baseCtx().action,
        type: "START_PROMOTION",
      },
    });
    const d = evaluateListingPreviewPolicyFromContext(ctx);
    const dup = d.ruleResults.find((r) => r.ruleCode === "duplicate_promotion");
    expect(dup?.result).toBe("blocked");
  });

  it("warns for high-risk type when autonomy is OFF", () => {
    const ctx = baseCtx({
      action: {
        ...baseCtx().action,
        type: "APPLY_PRICE_CHANGE",
        metadata: { deltaPct: 1 },
      },
    });
    const d = evaluateListingPreviewPolicyFromContext(ctx);
    const hr = d.ruleResults.find((r) => r.ruleCode === "high_risk_approval");
    expect(hr?.result).toBe("warning");
    expect(d.disposition).toBe("ALLOW_WITH_APPROVAL");
  });

  it("warns when action risk is HIGH even if type is not in high-risk list", () => {
    const ctx = baseCtx({
      action: {
        ...baseCtx().action,
        type: "UPDATE_LISTING_COPY",
        risk: "HIGH",
      },
    });
    const d = evaluateListingPreviewPolicyFromContext(ctx);
    const hr = d.ruleResults.find((r) => r.ruleCode === "high_risk_approval");
    expect(hr?.result).toBe("warning");
  });
});
