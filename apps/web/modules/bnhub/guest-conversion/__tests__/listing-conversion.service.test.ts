import { BnhubBookingFunnelStage } from "@prisma/client";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import { buildListingConversionMetrics } from "../listing-conversion.service";

vi.mock("@/lib/db", () => ({
  prisma: {
    bnhubClientListingViewEvent: { count: vi.fn() },
    bnhubClientBookingFunnelEvent: { count: vi.fn() },
  },
}));

describe("buildListingConversionMetrics", () => {
  beforeEach(() => {
    vi.mocked(prisma.bnhubClientListingViewEvent.count).mockResolvedValue(0);
    vi.mocked(prisma.bnhubClientBookingFunnelEvent.count).mockResolvedValue(0);
  });

  it("computes rates with full data", async () => {
    vi.mocked(prisma.bnhubClientListingViewEvent.count).mockResolvedValue(50);
    vi.mocked(prisma.bnhubClientBookingFunnelEvent.count).mockImplementation((args) => {
      const stage = (args as { where?: { stage?: BnhubBookingFunnelStage } })?.where?.stage;
      if (stage === BnhubBookingFunnelStage.STARTED) return Promise.resolve(10);
      if (stage === BnhubBookingFunnelStage.PAID) return Promise.resolve(4);
      return Promise.resolve(0);
    });
    const r = await buildListingConversionMetrics("lst_1");
    expect(r.metrics.listingViews).toBe(50);
    expect(r.metrics.bookingStarts).toBe(10);
    expect(r.metrics.bookingCompletions).toBe(4);
    expect(r.metrics.viewToStartRate).toBe(20);
    expect(r.metrics.startToBookingRate).toBe(40);
  });

  it("returns safe partials when prisma fails", async () => {
    vi.mocked(prisma.bnhubClientListingViewEvent.count).mockRejectedValue(new Error("db"));
    const r = await buildListingConversionMetrics("lst_2");
    expect(r.metrics.listingViews).toBeUndefined();
    expect(r.dataNotes.length).toBeGreaterThan(0);
  });
});
