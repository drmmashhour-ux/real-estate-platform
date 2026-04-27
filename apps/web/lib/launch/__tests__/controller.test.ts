import { describe, expect, it } from "vitest";

import { computeCurrentDayFromStart } from "@/lib/launch/launchDayPhase";

describe("computeCurrentDayFromStart (Order 50)", () => {
  it("is 1 on the start day", () => {
    const t0 = new Date("2026-01-10T12:00:00.000Z");
    expect(computeCurrentDayFromStart(t0, new Date("2026-01-10T00:00:00.000Z"))).toBe(1);
  });

  it("advances at UTC day boundaries and clamps 1–7", () => {
    const start = new Date("2026-01-10T00:00:00.000Z");
    expect(computeCurrentDayFromStart(start, new Date("2026-01-12T00:00:00.000Z"))).toBe(3);
    expect(computeCurrentDayFromStart(start, new Date("2026-01-20T00:00:00.000Z"))).toBe(7);
  });
});
