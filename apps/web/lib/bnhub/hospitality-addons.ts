import type {
  BnhubListingServicePricingType,
  BnhubTrustRiskLevel,
  ShortTermListing,
} from "@prisma/client";
import { prisma } from "@/lib/db";

export type SelectedAddonInput = { listingServiceId: string; quantity: number };

export type AddonLineBreakdown = {
  listingServiceId: string;
  serviceId: string;
  serviceCode: string;
  name: string;
  category: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  pricingType: BnhubListingServicePricingType;
  isIncluded: boolean;
  requiresApproval: boolean;
  /** Not included in immediate charge — host/platform will quote. */
  quoteRequired: boolean;
  currency: string;
};

const ELEVATED_RISK: BnhubTrustRiskLevel[] = ["HIGH", "CRITICAL"];

export function computeAddonLineCents(
  pricingType: BnhubListingServicePricingType,
  priceCents: number,
  nights: number,
  guestCount: number,
  quantity: number,
  isIncluded: boolean
): { unitPriceCents: number; totalPriceCents: number } {
  const q = Math.max(1, Math.min(99, Math.floor(quantity) || 1));
  const gc = Math.max(1, Math.min(50, Math.floor(guestCount) || 1));
  const n = Math.max(1, nights);

  if (isIncluded || pricingType === "FREE") {
    return { unitPriceCents: 0, totalPriceCents: 0 };
  }

  switch (pricingType) {
    case "FIXED":
      return {
        unitPriceCents: priceCents,
        totalPriceCents: priceCents * q,
      };
    case "PER_DAY": {
      const total = priceCents * n * q;
      return { unitPriceCents: Math.round(total / q) || priceCents, totalPriceCents: total };
    }
    case "PER_GUEST": {
      const total = priceCents * gc * q;
      return { unitPriceCents: Math.round(total / q) || priceCents, totalPriceCents: total };
    }
    case "PER_BOOKING":
      return {
        unitPriceCents: priceCents,
        totalPriceCents: priceCents * q,
      };
    case "QUOTE_REQUIRED":
      return { unitPriceCents: 0, totalPriceCents: 0 };
    default:
      return { unitPriceCents: 0, totalPriceCents: 0 };
  }
}

export function catalogAddonAllowedForListing(args: {
  isPremiumTier: boolean;
  minListingTrustScore: number | null;
  listingTrustScore: number | null;
  overallRiskLevel: BnhubTrustRiskLevel | null;
}): boolean {
  if (args.isPremiumTier && args.overallRiskLevel && ELEVATED_RISK.includes(args.overallRiskLevel)) {
    return false;
  }
  if (args.minListingTrustScore != null) {
    const score = args.listingTrustScore ?? 0;
    if (score < args.minListingTrustScore) return false;
  }
  return true;
}

export async function loadListingTrustContext(listingId: string): Promise<{
  trustScore: number | null;
  overallRiskLevel: BnhubTrustRiskLevel | null;
}> {
  const row = await prisma.bnhubTrustProfile.findUnique({
    where: { listingId },
    select: { trustScore: true, overallRiskLevel: true },
  });
  return {
    trustScore: row?.trustScore ?? null,
    overallRiskLevel: row?.overallRiskLevel ?? null,
  };
}

/**
 * Heuristic suggestions for checkout / host onboarding (no network call).
 */
export function suggestAddonServiceCodes(
  listing: Pick<ShortTermListing, "propertyType" | "city" | "familyFriendly" | "experienceTags">
): string[] {
  const type = (listing.propertyType ?? "").toLowerCase();
  const tags = JSON.stringify(listing.experienceTags ?? []);
  const luxury = /luxury|penthouse|villa/i.test(type) || /luxury|waterfront/i.test(tags);
  const family = listing.familyFriendly || /family/i.test(tags);

  if (luxury) {
    return ["concierge", "spa_service", "private_chef", "airport_pickup"];
  }
  if (family) {
    return ["meal_delivery", "laundry_service", "daily_cleaning", "luggage_storage"];
  }
  if (/apartment|condo/i.test(type) || /montreal|mtl|toronto|vancouver/i.test((listing.city ?? "").toLowerCase())) {
    return ["breakfast", "daily_cleaning", "airport_pickup"];
  }
  return ["breakfast", "daily_cleaning", "concierge"];
}

export async function resolveAddonSelections(args: {
  listingId: string;
  nights: number;
  guestCount: number;
  selections: SelectedAddonInput[];
}): Promise<{ lines: AddonLineBreakdown[]; addonsSubtotalCents: number; error?: string }> {
  const { listingId, nights, guestCount } = args;
  const raw = (args.selections ?? []).filter((s) => s.listingServiceId && s.quantity > 0);
  const mergedQty = new Map<string, number>();
  for (const s of raw) {
    mergedQty.set(s.listingServiceId, (mergedQty.get(s.listingServiceId) ?? 0) + s.quantity);
  }
  const selections = [...mergedQty.entries()].map(([listingServiceId, quantity]) => ({
    listingServiceId,
    quantity,
  }));
  if (selections.length === 0) {
    return { lines: [], addonsSubtotalCents: 0 };
  }

  const trust = await loadListingTrustContext(listingId);
  const ids = [...mergedQty.keys()];

  const offers = await prisma.bnhubListingService.findMany({
    where: { id: { in: ids }, listingId },
    include: {
      service: true,
    },
  });
  const byId = new Map(offers.map((o) => [o.id, o]));

  const lines: AddonLineBreakdown[] = [];
  let addonsSubtotalCents = 0;

  for (const sel of selections) {
    const offer = byId.get(sel.listingServiceId);
    if (!offer) {
      return { lines: [], addonsSubtotalCents: 0, error: "Invalid add-on selection" };
    }
    if (
      !offer.service.isActive ||
      offer.adminDisabled ||
      !offer.isEnabled ||
      offer.moderationStatus !== "APPROVED"
    ) {
      return { lines: [], addonsSubtotalCents: 0, error: "Selected add-on is not available" };
    }
    if (
      !catalogAddonAllowedForListing({
        isPremiumTier: offer.service.isPremiumTier,
        minListingTrustScore: offer.service.minListingTrustScore,
        listingTrustScore: trust.trustScore,
        overallRiskLevel: trust.overallRiskLevel,
      })
    ) {
      return { lines: [], addonsSubtotalCents: 0, error: "Selected add-on is not available for this listing" };
    }

    const { unitPriceCents, totalPriceCents } = computeAddonLineCents(
      offer.pricingType,
      offer.priceCents,
      nights,
      guestCount,
      sel.quantity,
      offer.isIncluded
    );

    lines.push({
      listingServiceId: offer.id,
      serviceId: offer.serviceId,
      serviceCode: offer.service.serviceCode,
      name: offer.service.name,
      category: offer.service.category,
      quantity: Math.max(1, Math.floor(sel.quantity)),
      unitPriceCents,
      totalPriceCents,
      pricingType: offer.pricingType,
      isIncluded: offer.isIncluded,
      requiresApproval: offer.requiresApproval,
      quoteRequired: offer.pricingType === "QUOTE_REQUIRED",
      currency: offer.currency,
    });
    addonsSubtotalCents += totalPriceCents;
  }

  return { lines, addonsSubtotalCents };
}

export type GuestListingOfferDTO = {
  id: string;
  serviceId: string;
  serviceCode: string;
  name: string;
  category: string;
  description: string | null;
  icon: string | null;
  pricingType: BnhubListingServicePricingType;
  priceCents: number;
  currency: string;
  isIncluded: boolean;
  requiresApproval: boolean;
  notes: string | null;
  availabilityRules: unknown;
};

export async function listGuestVisibleListingServices(listingId: string): Promise<GuestListingOfferDTO[]> {
  const [trust, rows] = await Promise.all([
    loadListingTrustContext(listingId),
    prisma.bnhubListingService.findMany({
      where: {
        listingId,
        isEnabled: true,
        adminDisabled: false,
        moderationStatus: "APPROVED",
        service: { isActive: true },
      },
      include: { service: true },
      orderBy: [{ service: { category: "asc" } }, { service: { name: "asc" } }],
    }),
  ]);

  const out: GuestListingOfferDTO[] = [];
  for (const row of rows) {
    const s = row.service;
    if (
      !catalogAddonAllowedForListing({
        isPremiumTier: s.isPremiumTier,
        minListingTrustScore: s.minListingTrustScore,
        listingTrustScore: trust.trustScore,
        overallRiskLevel: trust.overallRiskLevel,
      })
    ) {
      continue;
    }
    out.push({
      id: row.id,
      serviceId: row.serviceId,
      serviceCode: s.serviceCode,
      name: s.name,
      category: s.category,
      description: s.description,
      icon: s.icon,
      pricingType: row.pricingType,
      priceCents: row.priceCents,
      currency: row.currency,
      isIncluded: row.isIncluded,
      requiresApproval: row.requiresApproval,
      notes: row.notes,
      availabilityRules: row.availabilityRules,
    });
  }
  return out;
}

export async function assertListingOwner(userId: string | null, listingId: string): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!userId) return { ok: false, status: 401, message: "Sign in required" };
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return { ok: false, status: 404, message: "Listing not found" };
  if (listing.ownerId !== userId) return { ok: false, status: 403, message: "Not allowed" };
  return { ok: true };
}
