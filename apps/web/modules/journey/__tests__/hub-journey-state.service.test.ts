import { describe, expect, it } from "vitest";
import { buildHubJourneyPlan } from "../hub-journey-state.service";

const baseCtx = { locale: "en", country: "ca" };

describe("buildHubJourneyPlan", () => {
  it("builds buyer plan with first step in progress when empty", () => {
    const plan = buildHubJourneyPlan("buyer", { ...baseCtx });
    expect(plan.hub).toBe("buyer");
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(["in_progress", "blocked"]).toContain(plan.steps[0].status);
    expect(plan.progressPercent).toBe(0);
  });

  it("marks buyer progress when shortlist exists", () => {
    const plan = buildHubJourneyPlan("buyer", {
      ...baseCtx,
      buyerCitySelected: true,
      buyerBudgetSet: true,
      buyerBrowseSessions: 3,
      buyerShortlistCount: 2,
    });
    expect(plan.steps.find((s) => s.id === "buyer-4-shortlist")?.status).toBe("completed");
    expect(plan.progressPercent).toBeGreaterThan(0);
  });

  it("does not mutate context object", () => {
    const ctx = { ...baseCtx, buyerShortlistCount: 1 };
    const snap = JSON.stringify(ctx);
    buildHubJourneyPlan("buyer", ctx);
    expect(JSON.stringify(ctx)).toBe(snap);
  });
});
