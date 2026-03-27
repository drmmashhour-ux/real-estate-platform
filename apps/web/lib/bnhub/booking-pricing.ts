/**
 * BNHub booking pricing engine.
 * Computes full price breakdown: nightly rates, cleaning, taxes, fees, deposit, total.
 * Reusable across listing page, checkout, booking service, and admin.
 */

import { prisma } from "@/lib/db";
import { calculateQuebecRetailTaxOnLodgingBaseExclusiveCents } from "@/lib/tax/quebec-tax-engine";
import {
  resolveAddonSelections,
  type AddonLineBreakdown,
  type SelectedAddonInput,
} from "@/lib/bnhub/hospitality-addons";

const GUEST_SERVICE_FEE_PERCENT = 12;
const HOST_FEE_PERCENT = 3;

export type PricingBreakdown = {
  /** Per-night amounts in cents (for date-based overrides) */
  nightlyBreakdown: { date: string; cents: number }[];
  /** Sum of nightly amounts */
  subtotalCents: number;
  cleaningFeeCents: number;
  /** Québec GST on (subtotal + cleaning), then QST on (subtotal + cleaning + GST) */
  gstCents: number;
  qstCents: number;
  /** gstCents + qstCents */
  taxCents: number;
  /** Guest-facing service fee */
  serviceFeeCents: number;
  /** Host fee (deducted from host payout) */
  hostFeeCents: number;
  /** Security deposit (held, not charged upfront unless policy says otherwise) */
  depositCents: number;
  /** Lodging + taxes + platform service fee (before hospitality add-ons) */
  lodgingTotalBeforeAddonsCents: number;
  /** Selected add-on line items (shown before pay; included items appear with $0) */
  addonLines: AddonLineBreakdown[];
  /** Sum of chargeable add-on line totals */
  addonsSubtotalCents: number;
  /** Platform cut on add-ons (same % as host fee on lodging subtotal, applied to add-on subtotal) */
  addonsHostFeeCents: number;
  /** Total charged to guest (lodging total + add-ons) */
  totalCents: number;
  /** Amount host receives (lodging payout + add-ons net of host fee on add-ons) */
  hostPayoutCents: number;
  nights: number;
  currency: string;
};

export type ComputePricingParams = {
  listingId: string;
  checkIn: string; // ISO date
  checkOut: string;
  guestCount?: number;
  /** Optional BNHub hospitality add-ons (listing service row ids + qty) */
  selectedAddons?: SelectedAddonInput[];
};

/**
 * Compute full pricing breakdown for a stay.
 * Uses listing base price, optional date-level overrides from AvailabilitySlot,
 * and optional PricingRule multipliers for the date range.
 */
export async function computeBookingPricing(
  params: ComputePricingParams
): Promise<{ breakdown: PricingBreakdown; listing: { id: string; title: string; currency: string } } | null> {
  const { listingId, checkIn, checkOut } = params;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights < 1) return null;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      nightPriceCents: true,
      currency: true,
      cleaningFeeCents: true,
      securityDepositCents: true,
      maxGuests: true,
    },
  });
  if (!listing) return null;

  // Build per-night prices: check AvailabilitySlot for priceOverrideCents per date
  const nightlyBreakdown: { date: string; cents: number }[] = [];
  let cursor = new Date(checkInDate);
  while (cursor < checkOutDate) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const slot = await prisma.availabilitySlot.findUnique({
      where: {
        listingId_date: { listingId, date: cursor },
      },
      select: { priceOverrideCents: true },
    });
    const cents =
      slot?.priceOverrideCents ?? listing.nightPriceCents;
    nightlyBreakdown.push({ date: dateStr, cents });
    cursor.setDate(cursor.getDate() + 1);
  }

  const subtotalCents = nightlyBreakdown.reduce((s, n) => s + n.cents, 0);
  const cleaningFeeCents = listing.cleaningFeeCents ?? 0;
  const lodgingTaxableBaseCents = subtotalCents + cleaningFeeCents;
  const { gstCents, qstCents, taxCents } =
    calculateQuebecRetailTaxOnLodgingBaseExclusiveCents(lodgingTaxableBaseCents);
  const serviceFeeCents = Math.round(
    (subtotalCents * GUEST_SERVICE_FEE_PERCENT) / 100
  );
  const hostFeeCents = Math.round(
    (subtotalCents * HOST_FEE_PERCENT) / 100
  );
  const lodgingTotalBeforeAddonsCents =
    subtotalCents + cleaningFeeCents + taxCents + serviceFeeCents;
  const lodgingHostPayoutCents = subtotalCents + cleaningFeeCents - hostFeeCents;
  const depositCents = listing.securityDepositCents ?? 0;

  const guestCount = Math.min(
    listing.maxGuests ?? 4,
    Math.max(1, params.guestCount ?? 2)
  );

  let addonLines: AddonLineBreakdown[] = [];
  let addonsSubtotalCents = 0;
  if (params.selectedAddons?.length) {
    const resolved = await resolveAddonSelections({
      listingId,
      nights,
      guestCount,
      selections: params.selectedAddons,
    });
    if (resolved.error) return null;
    addonLines = resolved.lines;
    addonsSubtotalCents = resolved.addonsSubtotalCents;
  }

  const addonsHostFeeCents = Math.round((addonsSubtotalCents * HOST_FEE_PERCENT) / 100);
  const totalCents = lodgingTotalBeforeAddonsCents + addonsSubtotalCents;
  const hostPayoutCents = lodgingHostPayoutCents + addonsSubtotalCents - addonsHostFeeCents;

  return {
    breakdown: {
      nightlyBreakdown,
      subtotalCents,
      cleaningFeeCents,
      gstCents,
      qstCents,
      taxCents,
      serviceFeeCents,
      hostFeeCents,
      depositCents,
      lodgingTotalBeforeAddonsCents,
      addonLines,
      addonsSubtotalCents,
      addonsHostFeeCents,
      totalCents,
      hostPayoutCents,
      nights,
      currency: listing.currency ?? "USD",
    },
    listing: {
      id: listing.id,
      title: listing.title,
      currency: listing.currency ?? "USD",
    },
  };
}

/** Guest total (what guest pays). */
export function guestTotal(breakdown: PricingBreakdown): number {
  return breakdown.totalCents;
}

/** Host payout (before any refunds). */
export function hostPayout(breakdown: PricingBreakdown): number {
  return breakdown.hostPayoutCents;
}
