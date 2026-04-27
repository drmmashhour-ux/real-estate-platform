import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CACHE_KEYS, clearCache } from "@/lib/cache";

vi.mock("@/lib/db/routeSwitch", () => ({ getListingsDB: vi.fn() }));
vi.mock("@/lib/booking/dailyCalendar", () => ({ getListingDailyCalendar: vi.fn() }));
vi.mock("@/lib/booking/pricing", () => ({
  getBookingPriceBreakdown: vi.fn(),
  calculateFee: (n: number) => n * 0.1,
}));
vi.mock("@/lib/growth/earlyUsers", () => ({ getEarlyUserCount: vi.fn() }));
vi.mock("@/lib/marketplace/booking-hold", () => ({
  whereRangeBlocksListing: () => ({}),
}));
vi.mock("@/lib/ui/auditHeuristics", () => ({ runUIAudit: vi.fn() }));

import { getListingsDB } from "@/lib/db/routeSwitch";
import { getListingDailyCalendar } from "@/lib/booking/dailyCalendar";
import { getBookingPriceBreakdown } from "@/lib/booking/pricing";
import { getEarlyUserCount } from "@/lib/growth/earlyUsers";
import { runUIAudit } from "@/lib/ui/auditHeuristics";

import { runLaunchAudit } from "../readinessAudit";

describe("runLaunchAudit (Order 60)", () => {
  const queryRaw = vi.fn().mockResolvedValue([{ ok: 1 }]);
  const findFirstBooking = vi.fn().mockResolvedValue(null);
  const findFirstListing = vi.fn().mockResolvedValue({ id: "L1", price: 100 });
  const queryRawUnsafe = vi
    .fn()
    // overlap empty, then constraint row
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ conname: "no_overlap_booking" }]);

  beforeEach(() => {
    clearCache(CACHE_KEYS.launchReadiness);
    queryRaw.mockClear();
    findFirstBooking.mockClear();
    findFirstListing.mockClear();
    queryRawUnsafe.mockClear();
    queryRawUnsafe.mockReset();
    queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ conname: "no_overlap_booking" }]);
    vi.mocked(getListingsDB).mockReturnValue({
      $queryRaw: queryRaw,
      $queryRawUnsafe: queryRawUnsafe,
      listing: { findFirst: findFirstListing },
      booking: { findFirst: findFirstBooking },
    } as never);
    vi.mocked(getBookingPriceBreakdown).mockResolvedValue({
      nights: 2,
      nightly: [50, 50],
      baseSubtotal: 100,
      cleaningFee: 0,
      serviceFee: 10,
      taxes: 0,
      total: 110,
      currency: "USD",
      allNightsAvailable: true,
    });
    vi.mocked(getListingDailyCalendar).mockResolvedValue([
      {
        date: "2026-01-01",
        available: true,
        booked: false,
        basePrice: 100,
        suggestedPrice: 100,
        adjustmentPercent: 0,
        demandLevel: "low",
        reason: "x",
      },
    ] as never);
    vi.mocked(getEarlyUserCount).mockResolvedValue(0);
    vi.mocked(runUIAudit).mockResolvedValue({ score: 85, passed: [], failed: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns score, items, and criticalPass when all mocked paths pass", async () => {
    const r = await runLaunchAudit();
    expect(r.criticalPass).toBe(true);
    expect(r.items.length).toBe(7);
    expect(r.score).toBeGreaterThan(0);
    const ids = r.items.map((i) => i.id);
    expect(ids).toEqual([
      "db_overlap",
      "exclusion_constraint",
      "booking_api_path",
      "quote_sanity",
      "calendar_api",
      "ui_audit",
      "early_users",
    ]);
  });

  it("criticalPass is false if overlap query returns a row", async () => {
    queryRawUnsafe.mockReset();
    queryRawUnsafe
      .mockResolvedValueOnce([{ x: 1 }])
      .mockResolvedValueOnce([{ conname: "no_overlap_booking" }]);
    const r = await runLaunchAudit();
    expect(r.criticalPass).toBe(false);
    expect(r.items[0]!.id).toBe("db_overlap");
    expect(r.items[0]!.status).toBe("fail");
  });

  it("does not throw when early users query fails (warns)", async () => {
    queryRawUnsafe.mockReset();
    queryRawUnsafe
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ conname: "no_overlap_booking" }]);
    vi.mocked(getEarlyUserCount).mockRejectedValue(new Error("no table"));
    const r = await runLaunchAudit();
    expect(r.items.find((i) => i.id === "early_users")?.status).toBe("warn");
  });
});
