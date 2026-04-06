import { describe, expect, it, vi } from "vitest";
import { buildPitchDeckPptxBuffer } from "../export";
import {
  buildSlideSpecs,
  generateTractionSlide,
  loadPitchMetrics,
} from "../generator";

vi.mock("@/src/modules/investor-metrics/metricsSnapshot", () => ({
  getRecentMetricSnapshots: vi.fn().mockResolvedValue([
    {
      id: "n",
      date: new Date("2026-03-28"),
      totalUsers: 1100,
      activeUsers: 200,
      totalListings: 50,
      bookings: 12,
      revenue: 9000,
      conversionRate: 0.25,
      createdAt: new Date(),
    },
    {
      id: "o",
      date: new Date("2026-02-01"),
      totalUsers: 1000,
      activeUsers: 180,
      totalListings: 40,
      bookings: 10,
      revenue: 7000,
      conversionRate: 0.2,
      createdAt: new Date(),
    },
  ]),
}));

vi.mock("@/src/modules/investor-metrics/metricsEngine", async () => {
  const actual = await vi.importActual<typeof import("@/src/modules/investor-metrics/metricsEngine")>(
    "@/src/modules/investor-metrics/metricsEngine"
  );
  return {
    ...actual,
    aggregateSnapshotInputs: vi.fn().mockResolvedValue({
      totalUsers: 1100,
      activeUsers: 205,
      totalListings: 52,
      bookings: 14,
      revenue: 9500,
      conversionRate: 0.28,
    }),
  };
});

describe("pitchDeck generator", () => {
  it("generateTractionSlide embeds live metrics", () => {
    const m = {
      totalUsers: 100,
      activeUsers: 20,
      listings: 30,
      bookings30d: 5,
      revenue30d: 1200,
      conversionRate: 0.33,
      userGrowthRatePct: 10,
      snapshotDate: "2026-03-01",
    };
    const s = generateTractionSlide(m);
    expect(s.type).toBe("traction");
    expect(s.content.bullets).toContain(`Total users: ${m.totalUsers.toLocaleString()}`);
    expect((s.content as { metrics?: { revenue30d: number } }).metrics?.revenue30d).toBe(1200);
  });

  it("buildSlideSpecs returns 8 slides in order", () => {
    const m = {
      totalUsers: 1,
      activeUsers: 1,
      listings: 1,
      bookings30d: 0,
      revenue30d: 0,
      conversionRate: 0,
      userGrowthRatePct: 0,
      snapshotDate: null,
    };
    const specs = buildSlideSpecs(m);
    expect(specs).toHaveLength(8);
    expect(specs[0].type).toBe("title");
    expect(specs[7].type).toBe("vision");
  });

  it("loadPitchMetrics merges live aggregate with snapshots", async () => {
    const metrics = await loadPitchMetrics();
    expect(metrics.totalUsers).toBe(1100);
    expect(metrics.bookings30d).toBe(14);
    expect(metrics.userGrowthRatePct).toBeGreaterThan(0);
  });
});

describe("pitchDeck export", () => {
  it("buildPitchDeckPptxBuffer produces non-empty pptx", async () => {
    const buf = await buildPitchDeckPptxBuffer([
      {
        order: 0,
        type: "title",
        title: "Test",
        content: { subtitle: "Hello", bullets: ["A", "B"] },
      },
    ]);
    expect(buf.byteLength).toBeGreaterThan(2000);
    const u8 = new Uint8Array(buf);
    expect(u8[0]).toBe(0x50);
    expect(u8[1]).toBe(0x4b);
  });
});
