import { describe, expect, it } from "vitest";
import { confidenceMultiplier } from "../confidenceMultiplier";

describe("confidenceMultiplier", () => {
  it("returns banded multipliers", () => {
    expect(confidenceMultiplier(90)).toBe(1.0);
    expect(confidenceMultiplier(70)).toBe(0.9);
    expect(confidenceMultiplier(50)).toBe(0.75);
    expect(confidenceMultiplier(30)).toBe(0.6);
  });
});
