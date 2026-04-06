import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    platformRevenueEvent: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/monetization/revenue-events", () => ({
  recordRevenueEvent: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { recordRevenueEvent } from "@/lib/monetization/revenue-events";
import { recordBnhubGuestBookingRevenueFromPaidSession } from "@/lib/monetization/bnhub-guest-booking-revenue";

describe("recordBnhubGuestBookingRevenueFromPaidSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is idempotent when GMV row already exists", async () => {
    vi.mocked(prisma.platformRevenueEvent.findFirst).mockResolvedValue({ id: "x" } as never);
    await recordBnhubGuestBookingRevenueFromPaidSession(
      { id: "cs_1", amount_total: 5000, currency: "cad", metadata: {} } as never,
      "bid"
    );
    expect(recordRevenueEvent).not.toHaveBeenCalled();
  });

  it("records GMV, service fee, and upsell lines from session metadata", async () => {
    vi.mocked(prisma.platformRevenueEvent.findFirst).mockResolvedValue(null);
    await recordBnhubGuestBookingRevenueFromPaidSession(
      {
        id: "cs_2",
        amount_total: 12000,
        currency: "cad",
        metadata: {
          serviceFeeBaseCents: "500",
          serviceFeePeakCents: "100",
          upsellInsuranceCents: "1999",
          upsellEarlyCents: "0",
          upsellLateCents: "0",
        },
      } as never,
      "booking-uuid"
    );
    expect(recordRevenueEvent).toHaveBeenCalledTimes(3);
    expect(vi.mocked(recordRevenueEvent).mock.calls[0]?.[0]?.revenueType).toBe("bnhub_guest_booking_gmv");
    expect(vi.mocked(recordRevenueEvent).mock.calls[1]?.[0]?.revenueType).toBe("bnhub_guest_booking_service_fee");
    expect(vi.mocked(recordRevenueEvent).mock.calls[2]?.[0]?.revenueType).toBe("bnhub_guest_booking_upsell");
  });
});
