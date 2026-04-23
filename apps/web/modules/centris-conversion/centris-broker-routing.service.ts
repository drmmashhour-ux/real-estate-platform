import { prisma } from "@/lib/db";

import { logConversion } from "./centris-funnel.log";

export type CentrisBrokerRoutingResult = {
  bestBrokerId: string | null;
  routingReason: string;
  signals: { listingOwner: boolean; city?: string | null };
};

async function routingFromListingRow(
  ownerId: string | null | undefined,
  city: string | null | undefined,
  kind: "FSBO" | "CRM",
): Promise<CentrisBrokerRoutingResult> {
  if (!ownerId) {
    return {
      bestBrokerId: null,
      routingReason: `No listing owner (${kind}).`,
      signals: { listingOwner: false },
    };
  }
  logConversion(`routing_${kind.toLowerCase()}_owner`, { brokerId: ownerId });
  return {
    bestBrokerId: ownerId,
    routingReason:
      kind === "FSBO"
        ? "Primary broker — FSBO listing owner on LECIPM."
        : "Primary broker — CRM listing owner.",
    signals: { listingOwner: true, city },
  };
}

/** Resolve broker from a public listing id (tries FSBO row first, then CRM `Listing`). */
export async function resolveBrokerForCentrisListing(listingId: string): Promise<CentrisBrokerRoutingResult> {
  const fsbo = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { ownerId: true, city: true },
  });
  if (fsbo) return routingFromListingRow(fsbo.ownerId, fsbo.city, "FSBO");

  const crm = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { ownerId: true },
  });
  if (crm) return routingFromListingRow(crm.ownerId, null, "CRM");

  return {
    bestBrokerId: null,
    routingReason: "Listing not found.",
    signals: { listingOwner: false },
  };
}

/**
 * Routes Centris funnel leads to the listing broker — uses linked listing context only.
 */
export async function resolveCentrisBrokerRouting(leadId: string): Promise<CentrisBrokerRoutingResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      fsboListingId: true,
      listingId: true,
    },
  });

  if (!lead) {
    return { bestBrokerId: null, routingReason: "Lead not found", signals: { listingOwner: false } };
  }

  const lid = lead.fsboListingId ?? lead.listingId;
  if (!lid) {
    return {
      bestBrokerId: null,
      routingReason: "No listing linked — manual broker assignment required.",
      signals: { listingOwner: false },
    };
  }

  return resolveBrokerForCentrisListing(lid);
}
