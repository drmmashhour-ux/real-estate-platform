import { describe, it, expect } from "vitest";
import { suggestImprovements } from "../suggest-improvements";

describe("suggestImprovements", () => {
  it("returns default when no signals", () => {
    const s = suggestImprovements(
      {
        contentId: "x",
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalOpens: 0,
        snapshotCount: 0,
        ctr: null,
        ctrPercent: null,
        conversionRate: null,
        conversionPercent: null,
        openRate: null,
        openRatePercent: null,
      },
      "x".repeat(80)
    );
    expect(s.length).toBeGreaterThan(0);
    expect(s.some((x) => x.toLowerCase().includes("metric"))).toBe(true);
  });

  it("flags low CTR with enough views", () => {
    const s = suggestImprovements(
      {
        contentId: "x",
        totalViews: 100,
        totalClicks: 0,
        totalConversions: 0,
        totalOpens: 0,
        snapshotCount: 1,
        ctr: 0,
        ctrPercent: 0,
        conversionRate: null,
        conversionPercent: null,
        openRate: null,
        openRatePercent: null,
      },
      "hello world"
    );
    expect(s.some((x) => x.toLowerCase().includes("ctr"))).toBe(true);
  });
});
