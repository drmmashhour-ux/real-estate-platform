import { prisma } from "@/lib/db";
import { growthV3Flags } from "@/config/feature-flags";

export type PredictionResult = { score: number; confidence: number; explanation: string[] };

/** Heuristic conversion likelihood — grounded in listing + user signals when present. */
export async function predictConversion(listingId: string, userId?: string | null): Promise<PredictionResult> {
  if (!growthV3Flags.predictiveModelsV1) {
    return { score: 50, confidence: 0, explanation: ["FEATURE_PREDICTIVE_MODELS_V1 disabled"] };
  }
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: {
      priceCents: true,
      images: true,
      city: true,
      _count: { select: { buyerListingViews: true, leads: true } },
    },
  });
  if (!listing) {
    return { score: 0, confidence: 0.9, explanation: ["Listing not found"] };
  }
  const img = Array.isArray(listing.images) ? listing.images.length : 0;
  const views = listing._count.buyerListingViews;
  const leads = listing._count.leads;
  const viewToLead = views > 0 ? leads / views : 0;
  let score = 40 + Math.min(25, img * 2) + Math.min(30, viewToLead * 400);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const explanation = [
    `Images ${img}, views ${views}, leads ${leads} (derived ratio ${viewToLead.toFixed(4)}).`,
    userId ? `User ${userId.slice(0, 8)}… context not yet joined — conservative confidence.` : "Anonymous — lower confidence.",
  ];
  const confidence = userId ? 0.55 : 0.35;
  return { score, confidence, explanation };
}
