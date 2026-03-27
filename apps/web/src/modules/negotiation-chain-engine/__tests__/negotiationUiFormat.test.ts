import { describe, expect, it } from "vitest";
import { financingTermsSummary, versionTypeLabel } from "@/src/modules/negotiation-chain-engine/lib/negotiationUiFormat";

describe("negotiationUiFormat", () => {
  it("labels version types", () => {
    expect(versionTypeLabel(1)).toContain("Opening");
    expect(versionTypeLabel(2)).toContain("Counter");
    expect(versionTypeLabel(3)).toContain("3");
  });

  it("summarizes financing JSON safely", () => {
    expect(financingTermsSummary(null)).toBe("Not specified");
    expect(financingTermsSummary({ condition: true })).toContain("Conditional");
  });
});
