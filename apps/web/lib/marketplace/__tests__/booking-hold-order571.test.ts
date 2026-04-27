import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/routeSwitch", () => ({ getListingsDB: vi.fn() }));
vi.mock("@/src/services/analytics", () => ({ trackEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

import { getListingsDB } from "@/lib/db/routeSwitch";

import {
  confirmMarketplaceListingBookingFromCheckoutSession,
  confirmMarketplaceListingBookingPaid,
} from "../booking-hold";

describe("Order 57.1 — marketplace booking hold hardening", () => {
  const findUnique = vi.fn();
  const findFirst = vi.fn();
  const updateMany = vi.fn();
  const count = vi.fn();

  beforeEach(() => {
    findUnique.mockReset();
    findFirst.mockReset();
    updateMany.mockReset();
    count.mockReset();
    vi.mocked(getListingsDB).mockReturnValue({
      booking: { findUnique, findFirst, updateMany, count },
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("confirmMarketplaceListingBookingFromCheckoutSession is idempotent when already confirmed", async () => {
    findUnique.mockResolvedValue({
      id: "b1",
      status: "confirmed",
      userId: "u1",
      listingId: "l1",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-12"),
    });
    const r = await confirmMarketplaceListingBookingFromCheckoutSession({
      id: "cs1",
      payment_status: "paid",
      amount_total: 1000,
      metadata: { bookingId: "b1", listingId: "l1" },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.idempotent).toBe(true);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("confirm from session rejects amount mismatch", async () => {
    findUnique.mockResolvedValue({
      id: "b1",
      status: "pending",
      userId: "u1",
      listingId: "l1",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-12"),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const r = await confirmMarketplaceListingBookingFromCheckoutSession({
      id: "cs1",
      payment_status: "paid",
      amount_total: 1000,
      metadata: { bookingId: "b1", listingId: "l1", expected_amount_cents: "2000" },
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("amount_mismatch");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("confirm blocks when another booking overlaps", async () => {
    findUnique.mockResolvedValue({
      id: "b1",
      status: "pending",
      userId: "u1",
      listingId: "l1",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-12"),
      expiresAt: new Date(Date.now() + 60_000),
    });
    findFirst.mockResolvedValue({ id: "other" });
    const r = await confirmMarketplaceListingBookingFromCheckoutSession({
      id: "cs1",
      payment_status: "paid",
      amount_total: 1000,
      metadata: { bookingId: "b1", listingId: "l1" },
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("overlap");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("confirmMarketplaceListingBookingFromCheckoutSession confirms with atomic updateMany", async () => {
    findUnique.mockResolvedValue({
      id: "b1",
      status: "expired",
      userId: "u1",
      listingId: "l1",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-01-12"),
      expiresAt: new Date(Date.now() - 60_000),
    });
    findFirst.mockResolvedValue(null);
    updateMany.mockResolvedValue({ count: 1 });
    const r = await confirmMarketplaceListingBookingFromCheckoutSession({
      id: "cs1",
      payment_status: "paid",
      amount_total: 1000,
      metadata: { bookingId: "b1", listingId: "l1", userId: "u1", expected_amount_cents: "1000" },
      payment_intent: "pi_x",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.idempotent).toBe(false);
    expect(updateMany).toHaveBeenCalled();
  });

  it("double confirm on legacy helper uses updateMany and second call is idempotent", async () => {
    findUnique
      .mockResolvedValueOnce({
        id: "b1",
        status: "pending",
        userId: "u1",
        listingId: "l1",
        startDate: new Date("2026-01-10"),
        endDate: new Date("2026-01-12"),
        expiresAt: new Date(Date.now() + 60_000),
      })
      .mockResolvedValueOnce({
        id: "b1",
        status: "confirmed",
        userId: "u1",
        listingId: "l1",
        startDate: new Date("2026-01-10"),
        endDate: new Date("2026-01-12"),
      });
    updateMany.mockResolvedValueOnce({ count: 1 });
    const a = await confirmMarketplaceListingBookingPaid("b1", { paymentIntentId: "pi_1" });
    expect(a.ok).toBe(true);
    if (a.ok && "idempotent" in a) expect(a.idempotent).toBe(false);
    const b = await confirmMarketplaceListingBookingPaid("b1", { paymentIntentId: "pi_1" });
    expect(b.ok).toBe(true);
    if (b.ok && "idempotent" in b) expect(b.idempotent).toBe(true);
  });
});
