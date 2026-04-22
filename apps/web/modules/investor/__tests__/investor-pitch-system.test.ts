import { describe, expect, it } from "vitest";

import {
  aggregateWeekly,
  INVESTOR_PITCH_SAMPLE,
} from "@/modules/investor/investor-pitch-data.service";
import {
  buildFinancialSnapshot,
  buildPitchDeckPdf,
  buildSummaryReport,
} from "@/modules/investor/investor-export.service";
import { buildTenSlidePitchDeck } from "@/modules/investor/investor-pitch-slides.service";
import { buildNarrativeBlocks } from "@/modules/investor/investor-story.service";

describe("investor pitch narrative", () => {
  it("returns six ordered narrative blocks", () => {
    const blocks = buildNarrativeBlocks({ sampleMode: true });
    expect(blocks.map((b) => b.key)).toEqual([
      "problem",
      "solution",
      "product",
      "traction",
      "businessModel",
      "vision",
    ]);
    expect(blocks.every((b) => b.title && b.paragraphs.length > 0)).toBe(true);
  });

  it("embeds metric rows in traction when not sample", () => {
    const blocks = buildNarrativeBlocks({
      sampleMode: false,
      metricsRows: [
        { metric: "total_users", value: 42, timeframe: "all", source: "t" },
        { metric: "revenue_events_sum_30d", value: 99, timeframe: "30d", source: "t" },
      ],
    });
    const traction = blocks.find((b) => b.key === "traction");
    expect(traction?.paragraphs.join(" ")).toContain("42");
    expect(traction?.paragraphs.join(" ")).toContain("99");
  });
});

describe("investor pitch slides", () => {
  it("builds exactly ten slides", () => {
    const slides = buildTenSlidePitchDeck({ sampleMode: true });
    expect(slides).toHaveLength(10);
    expect(slides[0].index).toBe(1);
    expect(slides[9].index).toBe(10);
  });
});

describe("investor pitch exports", () => {
  it("generates non-empty PDF", () => {
    const buf = buildPitchDeckPdf(INVESTOR_PITCH_SAMPLE);
    expect(buf.length).toBeGreaterThan(800);
  });

  it("summary report includes key sections", () => {
    const md = buildSummaryReport(INVESTOR_PITCH_SAMPLE);
    expect(md).toContain("Executive summary");
    expect(md).toContain("## Live metrics snapshot");
  });

  it("financial snapshot is JSON-serializable", () => {
    const snap = buildFinancialSnapshot(INVESTOR_PITCH_SAMPLE);
    expect(snap.sampleMode).toBe(true);
    expect(snap.revenueByHub).toBeDefined();
  });
});

describe("aggregateWeekly", () => {
  it("rolls up daily points", () => {
    const daily = [
      {
        date: "2026-01-06",
        totalUsers: 10,
        totalListings: 1,
        bookings: 2,
        revenue: 100,
      },
      {
        date: "2026-01-07",
        totalUsers: 11,
        totalListings: 2,
        bookings: 3,
        revenue: 50,
      },
    ];
    const w = aggregateWeekly(daily);
    expect(w.length).toBeGreaterThanOrEqual(1);
  });
});

describe("sample dashboard VM", () => {
  it("includes weekly growth derived from daily", () => {
    expect(INVESTOR_PITCH_SAMPLE.growthWeekly.length).toBeGreaterThan(0);
  });
});
