import { describe, expect, it } from "vitest";
import { buildHubCopilotState } from "../hub-copilot.service";
import { buildHubJourneyPlan } from "../hub-journey-state.service";

const baseCtx = { locale: "en", country: "ca" };

describe("buildHubCopilotState", () => {
  it("returns at most 3 suggestions", () => {
    const plan = buildHubJourneyPlan("buyer", baseCtx);
    const copilot = buildHubCopilotState("buyer", baseCtx, plan);
    expect(copilot.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("prioritizes shortlist→contact when data supports it", () => {
    const ctx = {
      ...baseCtx,
      buyerShortlistCount: 2,
      buyerContactedSeller: false,
    };
    const plan = buildHubJourneyPlan("buyer", ctx);
    const copilot = buildHubCopilotState("buyer", ctx, plan);
    expect(copilot.suggestions.some((s) => s.id === "buy-shortlist-contact")).toBe(true);
  });

  it("softens explanations when signal confidence is low", () => {
    const plan = buildHubJourneyPlan("buyer", baseCtx);
    expect(plan.signalConfidence).toBe("low");
    const copilot = buildHubCopilotState("buyer", baseCtx, plan);
    expect(copilot.signalConfidence).toBe("low");
    expect(copilot.suggestions[0]?.explanation).toContain("Limited signals");
  });
});
