/**
 * AI advisory for buyers (risk, price vs market, potential issues) and host (pricing + improvements).
 * Informational only; not financial or legal advice.
 */
import { prisma } from "@/lib/db";
import { analyzeListing } from "@/lib/ai-listing-analysis";
import { getAiPricingRecommendation } from "@/lib/ai-pricing";

export type BuyerAdvisoryResult = {
  riskLevel: "low" | "medium" | "high";
  priceVsMarket: {
    label: string;
    detail: string;
    percentDiff?: number;
  };
  potentialIssues: string[];
};

/**
 * Buyer advisory: risk level, price vs market, potential issues for a listing (for guests viewing).
 */
export async function getBuyerAdvisory(listingId: string): Promise<BuyerAdvisoryResult | null> {
  try {
    const listing = await prisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        description: true,
        address: true,
        city: true,
        nightPriceCents: true,
        photos: true,
        amenities: true,
        verificationStatus: true,
        _count: { select: { reviews: true } },
      },
    });
    if (!listing) return null;

    const analysis = analyzeListing({
      title: listing.title,
      description: listing.description ?? undefined,
      amenities: Array.isArray(listing.amenities) ? (listing.amenities as string[]) : undefined,
      location: { city: listing.city, address: listing.address },
      photos: Array.isArray(listing.photos) ? (listing.photos as string[]) : undefined,
    });

    // Risk: low = score high + verified + reviews; medium = some gaps; high = low score or unverified
    let riskLevel: "low" | "medium" | "high" = "medium";
    if (listing.verificationStatus === "VERIFIED" && analysis.overallScore >= 70 && listing._count.reviews >= 2) {
      riskLevel = "low";
    } else if (analysis.overallScore < 50 || listing._count.reviews === 0) {
      riskLevel = "high";
    }

    // Price vs market
    let priceVsMarket: BuyerAdvisoryResult["priceVsMarket"] = {
      label: "At market",
      detail: "Price is in line with typical rates for this area.",
    };
    try {
      const pricing = await getAiPricingRecommendation(listingId, { store: false });
      const current = listing.nightPriceCents;
      const recommended = pricing.recommendedCents;
      if (current <= 0) {
        priceVsMarket = { label: "Price not set", detail: "Nightly price is not available." };
      } else {
        const percentDiff = Math.round(((current - recommended) / recommended) * 100);
        if (percentDiff > 15) {
          priceVsMarket = {
            label: "Above market",
            detail: `Listed about ${percentDiff}% above typical rates for this area.`,
            percentDiff,
          };
        } else if (percentDiff < -15) {
          priceVsMarket = {
            label: "Below market",
            detail: `Listed about ${Math.abs(percentDiff)}% below typical rates for this area.`,
            percentDiff,
          };
        } else {
          priceVsMarket = {
            label: "At market",
            detail: `Price is in line with typical rates ($${(recommended / 100).toFixed(0)}/night avg).`,
          };
        }
      }
    } catch {
      priceVsMarket = {
        label: "Market comparison unavailable",
        detail: "We couldn't compare this price to local market rates.",
      };
    }

    // Potential issues: from analysis recommendations, phrased for the buyer
    const potentialIssues: string[] = [];
    for (const r of analysis.recommendations) {
      if (r.type === "title") potentialIssues.push("Listing title could be more descriptive.");
      else if (r.type === "description") potentialIssues.push("Description is brief; consider asking the host for more details.");
      else if (r.type === "amenities") potentialIssues.push("Few amenities listed; you may want to confirm what's included.");
      else if (r.type === "photos") potentialIssues.push("Limited photos; consider requesting more images from the host.");
      else if (r.type === "location") potentialIssues.push("Location details are limited.");
    }
    if (potentialIssues.length === 0) potentialIssues.push("No major concerns identified.");

    return {
      riskLevel,
      priceVsMarket,
      potentialIssues,
    };
  } catch (e) {
    console.warn("[advisory] getBuyerAdvisory failed:", e);
    return null;
  }
}
