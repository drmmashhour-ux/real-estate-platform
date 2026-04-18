import { describe, expect, it, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { buildSearchConversionMetrics } from "../search-conversion.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    bnhubClientClickEvent: { count: vi.fn() },
    bnhubClientListingViewEvent: { count: vi.fn() },
  },
}));

describe("buildSearchConversionMetrics", () => {
  beforeEach(() => {
    vi.mocked(prisma.bnhubClientClickEvent.count).mockResolvedValue(0);
    vi.mocked(prisma.bnhubClientListingViewEvent.count).mockResolvedValue(0);
  });

  it("computes CTR when discovery-context views exist", async () => {
    vi.mocked(prisma.bnhubClientClickEvent.count).mockResolvedValue(5);
    vi.mocked(prisma.bnhubClientListingViewEvent.count).mockResolvedValue(100);
    const r = await buildSearchConversionMetrics("lst_1");
    expect(r.metrics.clicks).toBe(5);
    expect(r.metrics.impressions).toBe(100);
    expect(r.metrics.clickThroughRate).toBe(5);
    expect(r.dataNotes.length).toBeGreaterThan(0);
  });

  it("degrades when prisma throws", async () => {
    vi.mocked(prisma.bnhubClientClickEvent.count).mockRejectedValue(new Error("db"));
    const r = await buildSearchConversionMetrics("lst_2");
    expect(r.metrics.clicks).toBeUndefined();
    expect(r.dataNotes.some((n) => n.includes("unavailable"))).toBe(true);
  });
});
