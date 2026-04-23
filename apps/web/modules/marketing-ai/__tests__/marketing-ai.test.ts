import { describe, expect, it, beforeEach } from "vitest";

import { resetMarketingContentStoreForTests } from "@/modules/marketing-content/content-calendar-storage";
import { createContentItem } from "@/modules/marketing-content/content-calendar.service";
import { analyzePerformanceInsights, buildPlannerWeights, rankItemsForInsights } from "@/modules/marketing-ai/marketing-ai-optimizer.service";
import { generateMarketingPack } from "@/modules/marketing-ai/marketing-ai-generator.service";
import { distributeWeeklySlots, suggestPostingSlot } from "@/modules/marketing-ai/marketing-ai-scheduler.service";
import { generateWeeklyPlan } from "@/modules/marketing-ai/marketing-ai-planner.service";
import { ingestPostedPerformance } from "@/modules/marketing-ai/marketing-ai-learning.service";
import { resetMarketingAiStoreForTests } from "@/modules/marketing-ai/marketing-ai-storage";

describe("marketing-ai", () => {
  beforeEach(() => {
    resetMarketingAiStoreForTests();
    resetMarketingContentStoreForTests();
  });

  it("generateMarketingPack returns hook script caption cta", () => {
    const p = generateMarketingPack({
      audience: "BROKER",
      goal: "LEADS",
      topic: "pipeline",
      trend: "short-form",
    });
    expect(p.hook.length).toBeGreaterThan(10);
    expect(p.script).toContain("[0-3s]");
    expect(p.caption).toContain("#");
    expect(p.cta.length).toBeGreaterThan(5);
  });

  it("scheduler distributes slots across days without overload", () => {
    const d = distributeWeeklySlots(10, 2);
    expect(d.length).toBe(10);
    const perDay = new Map<number, number>();
    for (const x of d) {
      perDay.set(x.dayOffset, (perDay.get(x.dayOffset) ?? 0) + 1);
    }
    for (const n of perDay.values()) {
      expect(n).toBeLessThanOrEqual(2);
    }
  });

  it("suggestPostingSlot avoids duplicate slots when possible", () => {
    expect(suggestPostingSlot(0, [], {})).toBeDefined();
    const first = suggestPostingSlot(1, [], {});
    const second = suggestPostingSlot(1, [first], {});
    expect(second).not.toBe(first);
  });

  it("generateWeeklyPlan returns 7-day-oriented slots", () => {
    const plan = generateWeeklyPlan(new Date("2026-04-06T12:00:00Z"), { slotsTotal: 8 });
    expect(plan.slots.length).toBe(8);
    expect(plan.weekStartIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(plan.slots[0]!.platform).toBeTruthy();
    expect(plan.slots[0]!.generated?.hook).toBeTruthy();
  });

  it("optimizer builds weights from posted items", () => {
    const a = createContentItem({
      title: "x",
      type: "VIDEO",
      platform: "INSTAGRAM",
      audience: "BROKER",
      goal: "LEADS",
      status: "POSTED",
    });
    const withPerf = {
      ...a,
      performance: { views: 2000, clicks: 50, leads: 3, revenueCents: 10_000 },
    };
    const insights = analyzePerformanceInsights([withPerf]);
    expect(insights.bestPlatforms.length).toBeGreaterThan(0);
    const ranked = rankItemsForInsights([withPerf]);
    const w = buildPlannerWeights(insights, ranked);
    expect(w.platform.INSTAGRAM ?? 0).toBeGreaterThan(0.4);
  });

  it("learning ingests posted performance without throwing", () => {
    const it = createContentItem({
      title: "learn",
      type: "TEXT",
      platform: "LINKEDIN",
      audience: "INVESTOR",
      goal: "AWARENESS",
      status: "POSTED",
      hook: "Want more clarity on yield?",
    });
    const updated = {
      ...it,
      performance: { views: 800, clicks: 20, leads: 1, revenueCents: 5000 },
      status: "POSTED" as const,
    };
    const L = ingestPostedPerformance([updated]);
    expect(L.samples).toBeGreaterThan(0);
  });
});
