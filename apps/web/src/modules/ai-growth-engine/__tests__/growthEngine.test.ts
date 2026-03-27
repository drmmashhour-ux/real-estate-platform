import { describe, expect, it } from "vitest";
import { adaptContentForPlatform } from "@/src/modules/ai-growth-engine/application/adaptContentForPlatform";
import { optimizeContentStrategy } from "@/src/modules/ai-growth-engine/application/optimizeContentStrategy";
import { scheduleContent } from "@/src/modules/ai-growth-engine/application/scheduleContent";

describe("ai-growth-engine", () => {
  it("adaptContentForPlatform shortens X copy", () => {
    const long = "a".repeat(400);
    const x = adaptContentForPlatform({ platform: "x", baseCopy: long });
    expect(x.body.length).toBeLessThanOrEqual(260);
  });

  it("scheduleContent respects daily cap", () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      itemId: `i${i}`,
      platform: "linkedin" as const,
    }));
    const scheduled = scheduleContent({ items, start: new Date("2026-01-01T09:00:00Z"), timezone: "America/Toronto" });
    expect(scheduled.length).toBeLessThanOrEqual(12);
  });

  it("optimizeContentStrategy ranks topics", () => {
    const hints = optimizeContentStrategy({
      recent: [
        { topic: "A", metrics: { views: 100, clicks: 10, conversions: 1, engagement: 2 } },
        { topic: "B", metrics: { views: 10, clicks: 1, conversions: 0, engagement: 0.1 } },
      ],
    });
    expect(hints.emphasizeTopics[0]).toBe("A");
    expect(hints.avoidTopics).toContain("B");
  });
});
