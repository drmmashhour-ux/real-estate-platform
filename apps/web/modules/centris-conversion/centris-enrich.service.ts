import { prisma } from "@/lib/db";

import { logLead } from "./centris-funnel.log";

/** Deterministic enrichment — not ML; mirrors listing + buyer signals only. */
export async function enrichCentrisLeadSnapshot(leadId: string): Promise<{
  priceAnalysis: string;
  dealRating: string;
  similarListingIds: string[];
}> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        fsboListingId: true,
        listingId: true,
        dealValue: true,
        estimatedValue: true,
      },
    });

    let similarListingIds: string[] = [];
    let priceHint = "Comparable pricing requires broker review.";

    if (lead?.fsboListingId) {
      const fsboListingId = lead.fsboListingId;
      const fsbo = await prisma.fsboListing.findUnique({
        where: { id: fsboListingId },
        select: { city: true, priceCents: true, propertyType: true },
      });
      if (fsbo) {
        priceHint = `Listing priced near ${(fsbo.priceCents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" })} in ${fsbo.city} — advisory only.`;
        const peers = await prisma.fsboListing.findMany({
          where: {
            city: fsbo.city,
            status: "ACTIVE",
            id: { not: fsboListingId },
          },
          select: { id: true },
          take: 5,
          orderBy: { updatedAt: "desc" },
        });
        similarListingIds = peers.map((p) => p.id);
      }
    } else if (lead?.listingId) {
      const crm = await prisma.listing.findUnique({
        where: { id: lead.listingId },
        select: { price: true },
      });
      if (crm && Number.isFinite(crm.price)) {
        priceHint = `Listed near ${crm.price.toLocaleString("en-CA", {
          style: "currency",
          currency: "CAD",
        })} — advisory only.`;
      }
    }

    const rating =
      lead && (lead.dealValue ?? lead.estimatedValue ?? 0) > 400_000
        ? "Medium–high opportunity (rule-based)"
        : "Standard opportunity (rule-based)";

    logLead("enrich_ok", { leadId });

    return {
      priceAnalysis: priceHint,
      dealRating: rating,
      similarListingIds,
    };
  } catch (e) {
    logLead("enrich_fallback", { leadId, err: e instanceof Error ? e.message : "unknown" });
    return {
      priceAnalysis: "Unable to compute — broker follow-up recommended.",
      dealRating: "Unknown",
      similarListingIds: [],
    };
  }
}

export type EnrichedLeadPayload = Awaited<ReturnType<typeof enrichCentrisLeadSnapshot>>;
