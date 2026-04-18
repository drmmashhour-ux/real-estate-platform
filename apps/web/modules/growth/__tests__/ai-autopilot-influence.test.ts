import { describe, expect, it, vi, beforeEach } from "vitest";
import { applyCROInfluenceOverlay } from "../ai-autopilot-cro-overlay.service";
import { resetInfluenceMonitoringForTests } from "../ai-autopilot-influence-monitoring.service";
import { buildInfluenceSuggestions } from "../ai-autopilot-influence.service";
import type { AiInfluenceSuggestion } from "../ai-autopilot-influence.types";

const influenceFlags = vi.hoisted(() => ({
  influenceV1: true,
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    aiAutopilotInfluenceFlags: influenceFlags,
  };
});

beforeEach(() => {
  influenceFlags.influenceV1 = true;
  resetInfluenceMonitoringForTests();
});

const baseSnapshot = {
  conversionRateViewToLeadPercent: 1.2 as number | null,
  funnelSteps: { landing_view: 100, cta_click: 2, listing_view: 10, lead_capture: 1 },
  leadsFromPublicLanding: 1,
  campaignsCount: 2,
  clicks90d: 80,
  impressions90d: 2000,
};

describe("buildInfluenceSuggestions", () => {
  it("returns at most 3 suggestions sorted by priorityScore", () => {
    const out = buildInfluenceSuggestions(baseSnapshot, { now: "2026-04-01T00:00:00.000Z" });
    expect(out.length).toBeLessThanOrEqual(3);
    const scores = out.map((s) => s.priorityScore);
    const sorted = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sorted);
  });

  it("includes rationale and confidence", () => {
    const out = buildInfluenceSuggestions(baseSnapshot, { now: "2026-04-01T00:00:00.000Z" });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((s) => s.reason.length > 0 && s.confidence > 0)).toBe(true);
  });

  it("returns empty when influence flag off", () => {
    influenceFlags.influenceV1 = false;
    expect(buildInfluenceSuggestions(baseSnapshot)).toEqual([]);
  });

  it("does not use forbidden promise language in descriptions", () => {
    const out = buildInfluenceSuggestions(baseSnapshot, { now: "2026-04-01T00:00:00.000Z" });
    const bad = /\bguarantee\b|\bguaranteed\b/i;
    expect(out.every((s) => !bad.test(s.description) && !bad.test(s.title))).toBe(true);
  });
});

describe("applyCROInfluenceOverlay", () => {
  it("does not mutate original page data", () => {
    const page = Object.freeze({ headline: "H", cta: "Go" });
    const suggestions: AiInfluenceSuggestion[] = [
      {
        id: "x",
        target: "cro_ui",
        title: "t",
        description: "d",
        impact: "low",
        confidence: 0.5,
        reason: "r",
        createdAt: "2026-04-01T00:00:00.000Z",
        priorityScore: 40,
      },
    ];
    const overlay = applyCROInfluenceOverlay(page, suggestions);
    expect(overlay.original).toBe(page);
    expect(overlay.suggestions).toHaveLength(1);
  });
});
