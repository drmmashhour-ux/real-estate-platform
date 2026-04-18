import { describe, expect, it } from "vitest";
import { autonomyConfig } from "../config/autonomy.config";
import { evaluateActionPolicy } from "../policy/policy-engine";
import type { PolicyContext } from "../policy/policy-context";

describe("evaluateActionPolicy", () => {
  it("blocks apply price change when delta too large", () => {
    const ctx: PolicyContext = {
      action: {
        id: "a1",
        type: "APPLY_PRICE_CHANGE",
        target: { type: "fsbo_listing", id: "x" },
        confidence: 0.9,
        risk: "HIGH",
        title: "",
        explanation: "",
        humanReadableSummary: "",
        metadata: { deltaPct: autonomyConfig.pricing.maxIncreasePctPerRun + 5 },
        suggestedAt: new Date().toISOString(),
        sourceDetectorId: "t",
        opportunityId: "o",
      },
      observation: {
        id: "o",
        target: { type: "fsbo_listing", id: "x" },
        signals: [],
        aggregates: {},
        facts: {},
        builtAt: new Date().toISOString(),
      },
      autonomyMode: "SAFE_AUTOPILOT",
      targetActive: true,
      activePromotionCount: 0,
      priceDeltaTodayPct: 0,
    };
    const d = evaluateActionPolicy(ctx);
    expect(d.ruleResults.some((r) => r.result === "blocked")).toBe(true);
    expect(["BLOCK", "ALLOW_WITH_APPROVAL"]).toContain(d.disposition);
  });
});
