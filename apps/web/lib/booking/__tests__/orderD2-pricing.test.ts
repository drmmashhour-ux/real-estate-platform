import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/booking/dailyCalendar", () => ({
  getListingDailyCalendar: vi.fn(),
}));
vi.mock("@/lib/db/routeSwitch", () => ({
  getListingsDB: vi.fn(),
}));

import { getListingDailyCalendar } from "@/lib/booking/dailyCalendar";
import { getListingsDB } from "@/lib/db/routeSwitch";

import { calculateFee, getBookingPriceBreakdown } from "../pricing";

function dayStub(
  ymd: string,
  opt: { suggested?: number; booked?: boolean }
): Awaited<ReturnType<typeof getListingDailyCalendar>>[0] {
  return {
    date: ymd,
    available: !opt.booked,
    booked: opt.booked ?? false,
    basePrice: 100,
    suggestedPrice: opt.suggested ?? 100,
    adjustmentPercent: 0,
    demandLevel: "low",
    reason: "test",
  };
}

describe("Order D.2 — getBookingPriceBreakdown", () => {
  const listFind = vi.fn();

  beforeEach(() => {
    listFind.mockResolvedValue({ id: "L1", price: 100 });
    vi.mocked(getListingsDB).mockReturnValue({
      listing: { findUnique: listFind },
    } as never);
    vi.mocked(getListingDailyCalendar).mockImplementation(async (listingId, first, _last) => {
      if (listingId !== "L1") return [];
      if (first === "2024-06-10") {
        return [dayStub("2024-06-10", { suggested: 50 }), dayStub("2024-06-11", { suggested: 50 })];
      }
      if (first === "2024-07-01") {
        return [dayStub("2024-07-01", { suggested: 100 }), dayStub("2024-07-02", { suggested: 100, booked: true })];
      }
      return [];
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calculateFee matches 10% platform rate on subtotal (major units)", () => {
    expect(calculateFee(100)).toBe(10);
    expect(calculateFee(99.99)).toBeCloseTo(10, 1);
  });

  it("returns null when listing is missing", async () => {
    listFind.mockResolvedValue(null);
    const r = await getBookingPriceBreakdown({
      listingId: "L1",
      startDate: "2024-06-10",
      endDate: "2024-06-12",
    });
    expect(r).toBeNull();
  });

  it("sums per-night prices, adds 10% service fee, and flags unavailability if any night is booked", async () => {
    const r = await getBookingPriceBreakdown({
      listingId: "L1",
      startDate: "2024-06-10",
      endDate: "2024-06-12",
    });
    expect(r).not.toBeNull();
    expect(r!.nights).toBe(2);
    expect(r!.nightly).toEqual([50, 50]);
    expect(r!.baseSubtotal).toBe(100);
    expect(r!.serviceFee).toBe(10);
    expect(r!.taxes).toBe(0);
    expect(r!.cleaningFee).toBe(0);
    expect(r!.total).toBe(110);
    expect(r!.currency).toBe("USD");
    expect(r!.allNightsAvailable).toBe(true);
  });

  it("allNightsAvailable is false when a night is booked in the calendar", async () => {
    const r = await getBookingPriceBreakdown({
      listingId: "L1",
      startDate: "2024-07-01",
      endDate: "2024-07-03",
    });
    expect(r).not.toBeNull();
    expect(r!.nights).toBe(2);
    expect(r!.allNightsAvailable).toBe(false);
  });
});
