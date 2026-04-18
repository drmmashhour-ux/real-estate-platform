import { describe, expect, it } from "vitest";
import { analyzeGrowthFusion } from "../growth-fusion-analyzer.service";
import type { GrowthFusionRawSnapshot } from "../growth-fusion-snapshot.service";

function baseSnapshot(over: Partial<GrowthFusionRawSnapshot> = {}): GrowthFusionRawSnapshot {
  const base: GrowthFusionRawSnapshot = {
    createdAt: "2026-04-02T12:00:00.000Z",
    leads: { totalCount: 20, recent7dCount: 2 },
    ads: {
      summary: {
        impressions: 120,
        clicks: 40,
        leads: 1,
        conversionRatePercent: 0.8,
      } as GrowthFusionRawSnapshot["ads"]["summary"],
      byCampaign: [],
    },
    cro: {
      healthScore: 72,
    } as GrowthFusionRawSnapshot["cro"],
    content: { adDrafts: 0, listingDrafts: 0, outreachDrafts: 0, skippedReason: "content_assist_flags_off" },
    autopilot: { actions: [] },
    influence: { suggestions: [] },
    warnings: [],
  };
  return { ...base, ...over, leads: { ...base.leads, ...over.leads }, ads: { ...base.ads, ...over.ads } };
}

describe("analyzeGrowthFusion", () => {
  it("handles missing CRO and partial ads safely", () => {
    const s = analyzeGrowthFusion(
      baseSnapshot({
        cro: null,
        ads: { summary: null, byCampaign: null },
        warnings: ["ads_performance_unavailable"],
      }),
    );
    expect(s.signals.length).toBeGreaterThanOrEqual(0);
    expect(s.createdAt).toBe("2026-04-02T12:00:00.000Z");
    expect(s.grouped.leads.length + s.grouped.ads.length).toBeGreaterThanOrEqual(0);
  });

  it("detects acquisition + conversion cross-pattern (traffic, few leads)", () => {
    const snap = baseSnapshot({
      ads: {
        summary: {
          impressions: 200,
          clicks: 50,
          leads: 0,
          conversionRatePercent: 0.3,
        } as GrowthFusionRawSnapshot["ads"]["summary"],
        byCampaign: [],
      },
      leads: { totalCount: 30, recent7dCount: 1 },
    });
    const s = analyzeGrowthFusion(snap);
    expect(s.topProblems.some((p) => p.includes("Acquisition") || p.includes("Cross"))).toBe(true);
  });

  it("groups influence suggestions under ads vs cro", () => {
    const snap = baseSnapshot({
      influence: {
        suggestions: [
          {
            id: "i1",
            target: "ads_strategy",
            title: "Tighten audience",
            description: "Narrow geo",
            impact: "medium",
            confidence: 0.6,
            reason: "x",
            createdAt: "2026-04-02T12:00:00.000Z",
            priorityScore: 50,
          },
          {
            id: "i2",
            target: "cro_ui",
            title: "Hero clarity",
            description: "CTA",
            impact: "high",
            confidence: 0.7,
            reason: "y",
            createdAt: "2026-04-02T12:00:00.000Z",
            priorityScore: 80,
          },
        ],
      },
    });
    const s = analyzeGrowthFusion(snap);
    expect(s.grouped.ads.some((x) => x.id.includes("fuse-inf-i1"))).toBe(true);
    expect(s.grouped.cro.some((x) => x.id.includes("fuse-inf-i2"))).toBe(true);
  });
});
