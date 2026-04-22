import { describe, expect, it } from "vitest";
import {
  CEO_PRICING_APPROVAL_THRESHOLD,
  isHighRiskPayload,
  requiresApprovalForProposal,
} from "@/modules/ceo-ai/ceo-ai-policy";

describe("CEO AI policy", () => {
  it("flags large pricing deltas as high risk", () => {
    expect(
      isHighRiskPayload({
        kind: "pricing_lead_adjust",
        segment: "x",
        relativeDelta: CEO_PRICING_APPROVAL_THRESHOLD + 0.01,
      })
    ).toBe(true);
    expect(
      isHighRiskPayload({
        kind: "pricing_lead_adjust",
        segment: "x",
        relativeDelta: CEO_PRICING_APPROVAL_THRESHOLD - 0.01,
      })
    ).toBe(false);
  });

  it("forces approval when autonomy OFF", () => {
    expect(
      requiresApprovalForProposal(
        "GROWTH",
        {
          kind: "growth_family_content",
          themes: [],
        },
        { autonomyMode: "OFF" }
      )
    ).toBe(true);
  });
});
