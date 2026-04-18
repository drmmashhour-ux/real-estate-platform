import { describe, expect, it } from "vitest";
import { buildRealUrgencySignals } from "@/modules/conversion/real-urgency.service";

describe("buildRealUrgencySignals", () => {
  it("returns empty when no supported signals", () => {
    expect(buildRealUrgencySignals({})).toEqual([]);
  });

  it("includes recent update line only when update is within 14 days", () => {
    const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const lines = buildRealUrgencySignals({ listingUpdatedAt: recent });
    expect(lines.some((l) => l.includes("updated recently"))).toBe(true);
  });

  it("does not fabricate urgency from stale updates", () => {
    const old = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const lines = buildRealUrgencySignals({ listingUpdatedAt: old });
    expect(lines.some((l) => l.includes("updated recently"))).toBe(false);
  });

  it("passes through real view counts when provided", () => {
    const lines = buildRealUrgencySignals({ recentViewCount: 5 });
    expect(lines.some((l) => l.includes("5"))).toBe(true);
  });

  it("does not add fake countdowns or invented scarcity", () => {
    const lines = buildRealUrgencySignals({
      highIntentSignal: true,
      verifiedInventoryLimited: true,
      recentViewCount: 2,
      listingUpdatedAt: new Date().toISOString(),
    });
    const joined = lines.join(" ").toLowerCase();
    expect(joined).not.toMatch(/countdown|only \d+ left|hurry|ends in/i);
  });

  it("does not mutate input object", () => {
    const input = { recentViewCount: 3 as number | null, highIntentSignal: true };
    const copy = { ...input };
    buildRealUrgencySignals(input);
    expect(input).toEqual(copy);
  });
});
