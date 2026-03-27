import type { PrismaClient } from "@prisma/client";
import { generateAreaSeo, generateBlogSeo, generateListingSeo } from "../infrastructure/seoGeneratorAI";

export async function generateSeoFromData(
  db: PrismaClient,
  input:
    | { type: "listing"; listingId: string }
    | { type: "area"; city: string }
    | { type: "blog"; city: string; topic?: string }
) {
  if (input.type === "listing") {
    const listing = await db.fsboListing.findUnique({
      where: { id: input.listingId },
      select: { city: true, address: true, trustScore: true },
    });
    if (!listing) return null;
    const linkedLead = await db.lead.findFirst({
      where: { fsboListingId: input.listingId },
      orderBy: { createdAt: "desc" },
      select: { lecipmDealQualityScore: true },
    });
    return generateListingSeo({
      city: listing.city,
      address: listing.address,
      trustScore: listing.trustScore,
      dealScore: linkedLead?.lecipmDealQualityScore ?? null,
    });
  }
  if (input.type === "area") {
    return generateAreaSeo({ city: input.city });
  }
  return generateBlogSeo({ city: input.city, topic: input.topic });
}
