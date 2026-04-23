import { describe, expect, it } from "vitest";

import {
  formatExpectedRoiBand,
  summarizeRationale,
} from "../investment-opportunity-formatters";

describe("investment opportunity formatters", () => {
  it("formats fractional ROI into an advisory band", () => {
    expect(formatExpectedRoiBand(0.12)).toContain("%");
  });

  it("summarizes rationale JSON safely", () => {
    expect(summarizeRationale({ summary: "Concise rationale text" })).toContain("Concise");
    expect(summarizeRationale(null)).toBe("");
  });
});
