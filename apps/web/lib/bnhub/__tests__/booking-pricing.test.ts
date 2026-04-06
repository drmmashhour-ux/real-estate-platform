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
    pricingRule: {
      findMany: vi.fn(),
    },
    userLoyaltyProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("BNHub booking pricing", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const { prisma } = await import("@/lib/db");
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userLoyaltyProfile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.userLoyaltyProfile.create).mockResolvedValue({
      id: "lp-new",
      userId: "guest-new",
      completedBookings: 0,
      totalBookings: 0,
      tier: "NONE",
      lastBookingAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
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
    expect(result!.breakdown.earlyBookingDiscountCents).toBe(0);
    expect(result!.breakdown.lodgingSubtotalAfterDiscountCents).toBe(30000);
    expect(result!.breakdown.cleaningFeeCents).toBe(5000);
    const expectedTax = calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(35000);
    expect(result!.breakdown.gstCents).toBe(expectedTax.gstCents);
    expect(result!.breakdown.qstCents).toBe(expectedTax.qstCents);
    expect(result!.breakdown.taxCents).toBe(expectedTax.taxCents);
    expect(result!.breakdown.serviceFeeCents).toBe(Math.round(30000 * 0.12));
    const lodging =
      result!.breakdown.lodgingSubtotalAfterDiscountCents +
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

  it("applies EARLY_BOOKING discount to lodging taxes and fees", async () => {
    const { computeBookingPricing, guestTotal } = await import("../booking-pricing");
    const { prisma } = await import("@/lib/db");

    const listing = {
      id: "list-1",
      title: "Test",
      nightPriceCents: 10000,
      currency: "USD",
      cleaningFeeCents: 5000,
      securityDepositCents: 0,
      maxGuests: 4,
    };
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(listing as never);
    vi.mocked(prisma.availabilitySlot.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([
      {
        ruleType: "EARLY_BOOKING",
        payload: { minLeadDays: 30, discountPercent: 10 },
        validFrom: null,
        validTo: null,
      },
    ] as never);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-07-15",
      checkOut: "2025-07-18",
      pricingAsOf: new Date(Date.UTC(2025, 5, 1, 12, 0, 0)),
    });

    expect(result).not.toBeNull();
    expect(result!.breakdown.subtotalCents).toBe(30000);
    expect(result!.breakdown.earlyBookingDiscountCents).toBe(3000);
    expect(result!.breakdown.lodgingSubtotalAfterDiscountCents).toBe(27000);
    const expectedTax = calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(32000);
    expect(result!.breakdown.taxCents).toBe(expectedTax.taxCents);
    expect(result!.breakdown.serviceFeeCents).toBe(Math.round(27000 * 0.12));
    const lodging =
      result!.breakdown.lodgingSubtotalAfterDiscountCents +
      result!.breakdown.cleaningFeeCents +
      result!.breakdown.taxCents +
      result!.breakdown.serviceFeeCents;
    expect(result!.breakdown.lodgingTotalBeforeAddonsCents).toBe(lodging);
    expect(guestTotal(result!.breakdown)).toBe(lodging);
  });

  it("applies only the best EARLY_BOOKING rule when multiple qualify (no percent stacking)", async () => {
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
    vi.mocked(prisma.availabilitySlot.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([
      {
        ruleType: "EARLY_BOOKING",
        payload: { minLeadDays: 7, discountPercent: 5 },
        validFrom: null,
        validTo: null,
      },
      {
        ruleType: "EARLY_BOOKING",
        payload: { minLeadDays: 7, discountPercent: 12 },
        validFrom: null,
        validTo: null,
      },
    ] as never);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-08-01",
      checkOut: "2025-08-04",
      pricingAsOf: new Date(Date.UTC(2025, 5, 1, 12, 0, 0)),
    });

    expect(result).not.toBeNull();
    const b = result!.breakdown;
    expect(b.subtotalCents).toBe(30000);
    /** 12% of nightly subtotal only — not 5% + 12% and not compounded */
    expect(b.earlyBookingDiscountCents).toBe(3600);
    expect(b.lodgingSubtotalAfterDiscountCents).toBe(26400);
  });

  it("recomputing pricing twice yields identical totals (Stripe quote stability)", async () => {
    const { computeBookingPricing, guestTotal } = await import("../booking-pricing");
    const { prisma } = await import("@/lib/db");

    const listing = {
      id: "list-1",
      title: "Test",
      nightPriceCents: 10000,
      currency: "USD",
      cleaningFeeCents: 5000,
      securityDepositCents: 0,
      maxGuests: 4,
    };
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(listing as never);
    vi.mocked(prisma.availabilitySlot.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([
      {
        ruleType: "EARLY_BOOKING",
        payload: { minLeadDays: 30, discountPercent: 10 },
        validFrom: null,
        validTo: null,
      },
    ] as never);

    const params = {
      listingId: "list-1",
      checkIn: "2025-07-15",
      checkOut: "2025-07-18",
      pricingAsOf: new Date(Date.UTC(2025, 5, 1, 12, 0, 0)),
    };
    const a = await computeBookingPricing(params);
    const b = await computeBookingPricing(params);
    expect(a && b).toBeTruthy();
    expect(guestTotal(a!.breakdown)).toBe(guestTotal(b!.breakdown));
    expect(a!.breakdown.totalCents).toBe(b!.breakdown.totalCents);
  });

  it("grand total equals line-item sum (guest charge = Stripe unit_amount)", async () => {
    const { computeBookingPricing } = await import("../booking-pricing");
    const { prisma } = await import("@/lib/db");

    const listing = {
      id: "list-1",
      title: "Test",
      nightPriceCents: 10000,
      currency: "USD",
      cleaningFeeCents: 5000,
      securityDepositCents: 0,
      maxGuests: 4,
    };
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(listing as never);
    vi.mocked(prisma.availabilitySlot.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([
      {
        ruleType: "EARLY_BOOKING",
        payload: { minLeadDays: 30, discountPercent: 10 },
        validFrom: null,
        validTo: null,
      },
    ] as never);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-07-15",
      checkOut: "2025-07-18",
      pricingAsOf: new Date(Date.UTC(2025, 5, 1, 12, 0, 0)),
    });
    expect(result).not.toBeNull();
    const br = result!.breakdown;
    expect(br.lodgingSubtotalAfterDiscountCents).toBe(br.subtotalCents - br.lodgingDiscountAppliedCents);
    expect(br.earlyBookingDiscountCents).toBeLessThanOrEqual(br.subtotalCents - 1);
    const lodgingCore =
      br.lodgingSubtotalAfterDiscountCents +
      br.cleaningFeeCents +
      br.taxCents +
      br.serviceFeeCents;
    expect(br.lodgingTotalBeforeAddonsCents).toBe(lodgingCore);
    expect(br.totalCents).toBe(lodgingCore + br.addonsSubtotalCents);
  });

  it("applies loyalty when higher than early-booking rule (single winner)", async () => {
    const { computeBookingPricing } = await import("../booking-pricing");
    const { prisma } = await import("@/lib/db");
    const { LoyaltyTier } = await import("@prisma/client");

    vi.mocked(prisma.userLoyaltyProfile.findUnique).mockResolvedValue({
      id: "lp1",
      userId: "guest-loyal",
      completedBookings: 4,
      totalBookings: 4,
      tier: LoyaltyTier.GOLD,
      lastBookingAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

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
    vi.mocked(prisma.availabilitySlot.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([
      {
        ruleType: "EARLY_BOOKING",
        payload: { minLeadDays: 7, discountPercent: 5 },
        validFrom: null,
        validTo: null,
      },
    ] as never);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-08-01",
      checkOut: "2025-08-04",
      pricingAsOf: new Date(Date.UTC(2025, 5, 1, 12, 0, 0)),
      guestUserId: "guest-loyal",
    });

    expect(result).not.toBeNull();
    const b = result!.breakdown;
    expect(b.subtotalCents).toBe(30000);
    expect(b.earlyBookingDiscountCents).toBe(1500);
    expect(b.loyaltyDiscountPercentOffered).toBe(8);
    expect(b.lodgingDiscountSource).toBe("LOYALTY");
    expect(b.lodgingDiscountAppliedCents).toBe(2400);
  });

  it("does not stack early and loyalty — picks max only", async () => {
    const { computeBookingPricing } = await import("../booking-pricing");
    const { prisma } = await import("@/lib/db");
    const { LoyaltyTier } = await import("@prisma/client");

    vi.mocked(prisma.userLoyaltyProfile.findUnique).mockResolvedValue({
      id: "lp1",
      userId: "guest-loyal",
      completedBookings: 2,
      totalBookings: 2,
      tier: LoyaltyTier.SILVER,
      lastBookingAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

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
    vi.mocked(prisma.availabilitySlot.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([
      {
        ruleType: "EARLY_BOOKING",
        payload: { minLeadDays: 7, discountPercent: 5 },
        validFrom: null,
        validTo: null,
      },
    ] as never);

    const result = await computeBookingPricing({
      listingId: "list-1",
      checkIn: "2025-08-01",
      checkOut: "2025-08-04",
      pricingAsOf: new Date(Date.UTC(2025, 5, 1, 12, 0, 0)),
      guestUserId: "guest-loyal",
    });

    expect(result).not.toBeNull();
    const b = result!.breakdown;
    expect(b.lodgingDiscountAppliedCents).toBe(1500);
    expect(b.lodgingDiscountSource).toBe("LOYALTY");
    expect(b.lodgingSubtotalAfterDiscountCents).toBe(28500);
  });
});
