import { describe, it, expect } from "vitest";
import { mayAutomate, requiresHuman } from "../policies/automation-boundaries.js";
import { logDecision, applyHumanOverride, getDecisionById } from "../services/decision-store.js";

describe("Automation boundaries", () => {
  it("allows flag_listing_for_review", () => {
    expect(mayAutomate("flag_listing_for_review")).toBe(true);
  });
  it("requires human for ban_account", () => {
    expect(requiresHuman("ban_account")).toBe(true);
    expect(mayAutomate("ban_account")).toBe(false);
  });
});

describe("Decision store and override", () => {
  it("logs decision and allows human override", () => {
    const decision = logDecision({
      agentType: "listing_moderation",
      entityType: "listing",
      entityId: "list-1",
      inputSummary: {},
      outputSummary: { recommendedAction: "flag_for_review" },
      confidenceScore: 0.8,
      recommendedAction: "flag_for_review",
      reasonCodes: [],
      automatedAction: null,
      humanOverride: null,
    });
    expect(decision.id).toBeDefined();
    expect(decision.humanOverride).toBeNull();

    const updated = applyHumanOverride(decision.id, {
      overrideBy: "admin-1",
      overrideAt: new Date().toISOString(),
      originalAction: "flag_for_review",
      newAction: "approve_listing",
      notes: "Verified manually",
    });
    expect(updated?.humanOverride?.newAction).toBe("approve_listing");
    const fetched = getDecisionById(decision.id);
    expect(fetched?.humanOverride?.overrideBy).toBe("admin-1");
  });
});
