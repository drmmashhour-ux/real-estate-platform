import type { ListingHealthActionPriority } from "@prisma/client";
import { prisma } from "@/lib/db";
import { computeContentScoreComponent } from "@/lib/quality/compute-content-score";
import { computeBehaviorScoreComponent } from "@/lib/quality/compute-behavior-score";
import { computePricingScoreComponent } from "@/lib/quality/compute-pricing-score";
import { computePerformanceScoreComponent } from "@/lib/quality/compute-performance-score";

type ActionDraft = {
  type: string;
  priority: ListingHealthActionPriority;
  title: string;
  description: string;
};

export async function generateHealthActionsForListing(listingId: string): Promise<ActionDraft[]> {
  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: {
      ownerId: true,
      listingVerificationStatus: true,
      instantBookEnabled: true,
      nightPriceCents: true,
    },
  });
  if (!listing) return [];

  const [content, pricing, performance, behavior] = await Promise.all([
    computeContentScoreComponent(listingId),
    computePricingScoreComponent(listingId),
    computePerformanceScoreComponent(listingId),
    computeBehaviorScoreComponent(listingId),
  ]);

  const contentDetail = content.detail as Record<string, unknown>;
  const photoCount = typeof contentDetail.photoCount === "number" ? contentDetail.photoCount : 0;
  const descLen = typeof contentDetail.descLen === "number" ? contentDetail.descLen : 0;
  const amenityCount = typeof contentDetail.amenityCount === "number" ? contentDetail.amenityCount : 0;

  const actions: ActionDraft[] = [];

  if (photoCount < 5) {
    actions.push({
      type: "add_photos",
      priority: "high",
      title: "Add more photos",
      description: "Listings with at least 5–8 high-quality photos convert significantly better. Show every room and key amenities.",
    });
  }

  const titleLen = typeof contentDetail.titleLen === "number" ? contentDetail.titleLen : 0;
  if (titleLen < 12 || descLen < 120) {
    actions.push({
      type: "improve_copy",
      priority: "high",
      title: "Improve title and description",
      description: "Expand your title and write a detailed description so guests know what to expect.",
    });
  }

  if (amenityCount < 5) {
    actions.push({
      type: "add_amenities",
      priority: "medium",
      title: "Complete amenities",
      description: "Select all amenities that apply so you appear in more filtered searches.",
    });
  }

  const priceDetail = pricing.detail as Record<string, unknown>;
  if (typeof priceDetail.priceVsPeerMedian === "number" && priceDetail.priceVsPeerMedian > 1.28) {
    actions.push({
      type: "review_pricing",
      priority: "high",
      title: "Review nightly price vs similar stays",
      description: "Your price is notably above similar listings in this area. Consider aligning with the market or highlighting premium value.",
    });
  } else if (typeof priceDetail.priceVsPeerMedian === "number" && priceDetail.priceVsPeerMedian < 0.72) {
    actions.push({
      type: "pricing_signal",
      priority: "low",
      title: "Check pricing positioning",
      description: "Your nightly rate is well below peers. Ensure it reflects your costs and positioning.",
    });
  }

  const perfDetail = performance.detail as Record<string, unknown>;
  if (typeof perfDetail.ctr === "number" && perfDetail.ctr < 0.02 && (perfDetail.views30d as number | undefined ?? 0) > 40) {
    actions.push({
      type: "improve_ctr",
      priority: "medium",
      title: "Improve search appeal",
      description: "Views are solid but click-through is low. Refresh your cover image and title to stand out in results.",
    });
  }

  const behDetail = behavior.detail as Record<string, unknown>;
  if (typeof behDetail.avgResponseTimeHours === "number" && behDetail.avgResponseTimeHours > 24) {
    actions.push({
      type: "response_time",
      priority: "high",
      title: "Improve response time",
      description: "Guests book faster when hosts reply within a few hours. Enable notifications and saved replies.",
    });
  }
  if (typeof behDetail.cancellationRate === "number" && behDetail.cancellationRate > 0.08) {
    actions.push({
      type: "reduce_cancellations",
      priority: "high",
      title: "Reduce cancellations",
      description: "High cancellation rates hurt ranking and trust. Keep your calendar accurate and decline only when necessary.",
    });
  }

  if (!listing.instantBookEnabled) {
    actions.push({
      type: "instant_book",
      priority: "low",
      title: "Consider Instant Book",
      description: "Instant Book listings often receive more bookings when other signals are strong.",
    });
  }

  if (listing.listingVerificationStatus !== "VERIFIED") {
    actions.push({
      type: "verify_listing",
      priority: "medium",
      title: "Complete verification",
      description: "Verified listings earn higher trust scores and clearer badges across the platform.",
    });
  }

  const hostUser = await prisma.user.findUnique({
    where: { id: listing.ownerId },
    select: { userVerificationProfile: { select: { identityVerified: true } } },
  });
  if (hostUser && !hostUser.userVerificationProfile?.identityVerified) {
    actions.push({
      type: "verify_account",
      priority: "medium",
      title: "Verify your account",
      description: "Completing host identity verification increases guest confidence.",
    });
  }

  const seen = new Set<string>();
  return actions.filter((a) => {
    if (seen.has(a.type)) return false;
    seen.add(a.type);
    return true;
  });
}
