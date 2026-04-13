import { ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { refreshDynamicPricingForListing } from "./dynamicPricingService";
import { refreshLuxuryTierForListing } from "./luxuryTierService";
import { recomputePropertyClassificationForListing, shouldScheduleClassificationRecompute } from "./propertyClassificationService";
import { refreshTrustProfileForListing } from "./trustFraudService";

export { shouldScheduleClassificationRecompute as shouldScheduleBnhubEngineRecompute };

/** Keys that should trigger a debounced full engine refresh (classification, trust, tier, pricing). */
export function shouldScheduleFullEngineRecompute(data: Record<string, unknown>): boolean {
  if (shouldScheduleClassificationRecompute(data)) return true;
  const pricingTrustKeys = new Set([
    "nightPriceCents",
    "address",
    "city",
    "region",
    "country",
    "latitude",
    "longitude",
    "listingStatus",
    "verificationStatus",
  ]);
  return Object.keys(data).some((k) => pricingTrustKeys.has(k));
}

const debouncers = new Map<string, ReturnType<typeof setTimeout>>();

async function ensureHostQualityRow(hostUserId: string): Promise<void> {
  await prisma.bnhubHostQualityProfile.upsert({
    where: { hostUserId },
    create: {
      hostUserId,
      responsivenessScore: 55,
      cancellationRateBps: 0,
      messageRateScore: 55,
    },
    update: {},
  });
}

/**
 * Sequential refresh so downstream engines see fresh rows (debounced per listing).
 */
export async function refreshAllBnhubListingEngines(listingId: string): Promise<void> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (!listing) return;
  await ensureHostQualityRow(listing.ownerId);
  await recomputePropertyClassificationForListing(listingId);
  await refreshTrustProfileForListing(listingId);
  await refreshLuxuryTierForListing(listingId);
  await refreshDynamicPricingForListing(listingId);
  await import("@/lib/quality/update-listing-quality")
    .then((m) => m.updateListingQuality(listingId))
    .catch((err) => {
      console.warn("[bnhub-engines] listing quality refresh failed", listingId, err);
    });
}

export function scheduleBnhubListingEngineRefresh(listingId: string, delayMs = 2000): void {
  const existing = debouncers.get(listingId);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    debouncers.delete(listingId);
    void refreshAllBnhubListingEngines(listingId).catch((err) => {
      console.warn("[bnhub-engines] refresh failed", listingId, err);
    });
  }, delayMs);
  debouncers.set(listingId, t);
}

export async function refreshPropertyClassification(listingId: string): Promise<void> {
  await recomputePropertyClassificationForListing(listingId);
}

export async function refreshLuxuryTier(listingId: string): Promise<void> {
  await refreshLuxuryTierForListing(listingId);
}

export async function refreshTrustProfile(listingId: string): Promise<void> {
  await refreshTrustProfileForListing(listingId);
}

export async function refreshDynamicPricing(listingId: string): Promise<void> {
  await refreshDynamicPricingForListing(listingId);
}

/** Batch for cron / edge (limit to protect DB). */
export async function dailyBatchRefreshEngines(limit = 80): Promise<{ processed: number }> {
  const rows = await prisma.shortTermListing.findMany({
    where: { listingStatus: ListingStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true },
  });
  for (const r of rows) {
    await refreshAllBnhubListingEngines(r.id);
  }
  return { processed: rows.length };
}
