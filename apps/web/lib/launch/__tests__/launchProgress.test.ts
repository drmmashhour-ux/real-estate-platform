import { describe, expect, it } from "vitest";

import { getLaunchPhaseBand } from "@/lib/launch/launchDayPhase";
import { getLaunchFocusLineForDay, launchPlan } from "@/lib/launch/plan";

describe("getLaunchPhaseBand", () => {
  it("day 1–3 → band 1 (early + traction focus)", () => {
    expect(getLaunchPhaseBand(1)).toBe(1);
    expect(getLaunchPhaseBand(3)).toBe(1);
  });
  it("day 4–5 → band 2 (campaigns + content)", () => {
    expect(getLaunchPhaseBand(4)).toBe(2);
    expect(getLaunchPhaseBand(5)).toBe(2);
  });
  it("day 6–7 → band 3 (conversion + urgency)", () => {
    expect(getLaunchPhaseBand(6)).toBe(3);
    expect(getLaunchPhaseBand(7)).toBe(3);
  });
});

describe("getLaunchFocusLineForDay", () => {
  it("returns focus from readonly launch plan", () => {
    const line = getLaunchFocusLineForDay(1);
    expect(line).toContain("Day 1");
    expect(line).toContain(launchPlan[0]!.focus);
  });
  it("clamps to 1–7", () => {
    expect(getLaunchFocusLineForDay(0)).toBe(getLaunchFocusLineForDay(1));
    expect(getLaunchFocusLineForDay(99)).toBe(getLaunchFocusLineForDay(7));
  });
});

describe("launchPlan immutability (spec)", () => {
  it("exposes 7 days", () => {
    expect(launchPlan.length).toBe(7);
  });
});
