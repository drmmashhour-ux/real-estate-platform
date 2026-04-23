import { describe, it, expect, vi } from "vitest";
import { generateWeeklyPlan, deployPlanToCalendar } from "../marketing-week-plan.service";
import type { MarketingWeekPlanConfig } from "../marketing-week-plan.types";
import { validateWeeklyPlan } from "../marketing-week-plan-validation.service";

describe("MarketingWeekPlan Engine", () => {
  const config: MarketingWeekPlanConfig = {
    city: "Montreal",
    focusAreas: ["Griffintown", "Downtown"],
    audiences: ["BUYER", "INVESTOR", "BROKER"],
    goals: ["LEADS", "AWARENESS"],
  };

  it("should generate a 7-day plan with ~28 items (4 per day)", () => {
    const plan = generateWeeklyPlan(config);
    expect(plan.items.length).toBe(28);
    expect(plan.items[0]?.status).toBe("READY_FOR_APPROVAL");
  });

  it("should have video requests for video types", () => {
    const plan = generateWeeklyPlan(config);
    const videos = plan.items.filter(i => i.type === "VIDEO");
    expect(videos.length).toBeGreaterThan(0);
    videos.forEach(v => {
      expect(v.videoRequestId).toBeDefined();
    });
  });

  it("should pass validation with default generation", () => {
    const plan = generateWeeklyPlan(config);
    const validation = validateWeeklyPlan(plan.items);
    if (!validation.ok) {
      console.log("Validation errors:", validation.errors);
    }
    expect(validation.ok).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("should fail validation if hook is missing", () => {
    const plan = generateWeeklyPlan(config);
    plan.items[0]!.hook = "";
    const validation = validateWeeklyPlan(plan.items);
    expect(validation.ok).toBe(false);
    expect(validation.errors[0]).toContain("Hook is too short");
  });
});
