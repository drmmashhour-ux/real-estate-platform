/**
 * BNHub booking pricing engine tests.
 * Run with: npx vitest run lib/bnhub/__tests__/booking-pricing.test.ts
 * or npm test if configured.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateQuebecRetailTaxOnLodgingBaseExclusiveCents } from "@/lib/tax/quebec-tax-engine";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    shortTermListing: {
      findUnique: vi.fn(),
    },
    availabilitySlot: {
      findUnique: vi.fn(),
    },
  },
}));

describe("BNHub booking pricing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("computes guest total from breakdown", async () => {
    const { computeBookingPricing, guestTotal } = await import(
      "../booking-pricing"
    );
    const { prisma } = await import("@/lib/db");

    const listing = {
      id: "list-1",
      title: "Test",
      nightPriceCents: 10000,
      currency: "USD",
      cleaningFeeCents: 5000,
      securityDepositCents: 10000,
      maxGuests: 4,
    };
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(listing as never);
    vi.mocked(prisma.availabilitySlot.findUnique).mockResolvedValue(null);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-06-01",
      checkOut: "2025-06-04",
    });

    expect(result).not.toBeNull();
    expect(result!.breakdown.nights).toBe(3);
    expect(result!.breakdown.subtotalCents).toBe(30000);
    expect(result!.breakdown.cleaningFeeCents).toBe(5000);
    const expectedTax = calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(35000);
    expect(result!.breakdown.gstCents).toBe(expectedTax.gstCents);
    expect(result!.breakdown.qstCents).toBe(expectedTax.qstCents);
    expect(result!.breakdown.taxCents).toBe(expectedTax.taxCents);
    expect(result!.breakdown.serviceFeeCents).toBe(Math.round(30000 * 0.12));
    const lodging =
      result!.breakdown.subtotalCents +
      result!.breakdown.cleaningFeeCents +
      result!.breakdown.taxCents +
      result!.breakdown.serviceFeeCents;
    expect(result!.breakdown.lodgingTotalBeforeAddonsCents).toBe(lodging);
    expect(result!.breakdown.addonLines).toEqual([]);
    expect(result!.breakdown.addonsSubtotalCents).toBe(0);
    expect(result!.breakdown.addonsHostFeeCents).toBe(0);
    const total = guestTotal(result!.breakdown);
    expect(total).toBe(lodging);
  });

  it("uses price override from availability slot when present", async () => {
    const { computeBookingPricing } = await import("../booking-pricing");
    const { prisma } = await import("@/lib/db");

    const listing = {
      id: "list-1",
      title: "Test",
      nightPriceCents: 10000,
      currency: "USD",
      cleaningFeeCents: 0,
      securityDepositCents: 0,
      maxGuests: 4,
    };
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(listing as never);
    const date1 = new Date("2025-06-01");
    const date2 = new Date("2025-06-02");
    vi.mocked(prisma.availabilitySlot.findUnique)
      .mockResolvedValueOnce({ priceOverrideCents: 15000 } as never)
      .mockResolvedValueOnce({ priceOverrideCents: 15000 } as never)
      .mockResolvedValueOnce(null);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-06-01",
      checkOut: "2025-06-03",
    });

    expect(result).not.toBeNull();
    expect(result!.breakdown.nightlyBreakdown).toHaveLength(2);
    expect(result!.breakdown.nightlyBreakdown[0].cents).toBe(15000);
    expect(result!.breakdown.nightlyBreakdown[1].cents).toBe(15000);
    expect(result!.breakdown.subtotalCents).toBe(30000);
  });

  it("returns null for invalid dates (checkOut before or equal to checkIn)", async () => {
    const { computeBookingPricing } = await import("../booking-pricing");
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue({
      id: "list-1",
      title: "Test",
      nightPriceCents: 10000,
      currency: "USD",
      cleaningFeeCents: 0,
      securityDepositCents: 0,
      maxGuests: 4,
    } as never);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-06-05",
      checkOut: "2025-06-03",
    });

    expect(result).toBeNull();
  });
});
