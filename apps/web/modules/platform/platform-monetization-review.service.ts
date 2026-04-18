/**
 * Monetization architecture — maps major surfaces to buckets (advisory; no payment logic).
 */

import type {
  MonetizationBucket,
  MonetizedSurface,
  PlatformMonetizationReviewResult,
} from "./platform-improvement.types";
import type { PlatformReviewSnapshot } from "./platform-review-snapshot";
import { getDefaultPlatformReviewSnapshot } from "./platform-review-snapshot";

function surface(label: string, bucket: MonetizationBucket, notes: string): MonetizedSurface {
  return { label, bucket, notes };
}

export function buildPlatformMonetizationReview(
  snapshot: PlatformReviewSnapshot = getDefaultPlatformReviewSnapshot(),
): PlatformMonetizationReviewResult {
  const monetizedSurfaces: MonetizedSurface[] = [
    surface("Public listings browse + detail", "free_teaser", "Core discovery; monetization happens on conversion."),
    surface("Lead capture / CRM handoff", "commission", "Broker-side success fees or referrals when deals close."),
    surface("BNHub booking checkout", "paid_unlock", "Guest pays for stay; platform fee via existing checkout stack."),
    surface("Featured / boosted placement", "boost_upgrade", snapshot.featuredListingsV1 ? "Featured listings flag on." : "Featured listings flag off — boost SKUs may be limited."),
    surface("Host / seller subscriptions", "subscription", snapshot.subscriptionsV1 ? "Subscriptions flag on." : "Subscriptions flag off — Pro/Growth tiers may be invisible."),
    surface("Premium insights / growth machine", "paid_unlock", snapshot.growthMachineV1 ? "Growth Machine surfaces upsell analytical value." : "Growth Machine off — premium insights packaging may be thin."),
  ];

  const unmonetizedValueLeakage: string[] = [];
  if (!snapshot.billingV1) {
    unmonetizedValueLeakage.push("Billing flag off — paid unlock flows may not surface in all environments.");
  }
  if (!snapshot.growthRevenuePanelV1) {
    unmonetizedValueLeakage.push("Revenue panel off — internal operators under-see monetization telemetry vs traffic.");
  }
  if (snapshot.growthFusionV1 && !snapshot.growthRevenuePanelV1) {
    unmonetizedValueLeakage.push("Fusion intelligence without revenue panel — harder to tie recommendations to money.");
  }

  const highPriorityMonetizationGaps: string[] = [];
  if (!snapshot.subscriptionsV1 && snapshot.billingV1) {
    highPriorityMonetizationGaps.push("Billing on but subscriptions off — align subscription SKUs with public pricing pages.");
  }
  if (!snapshot.featuredListingsV1 && snapshot.listingMetricsV1) {
    highPriorityMonetizationGaps.push("Listing metrics on without featured listings — add a clear upgrade path for visibility.");
  }
  if (!snapshot.brokerAcquisitionV1) {
    highPriorityMonetizationGaps.push("Broker acquisition flag off — B2B pipeline value may be under-monetized in-product.");
  }

  const notes = [
    "Buckets are conceptual — actual SKU mapping stays in billing and product configuration.",
    "Do not change Stripe or checkout code based on this review alone.",
  ];

  return { monetizedSurfaces, unmonetizedValueLeakage, highPriorityMonetizationGaps, notes };
}
