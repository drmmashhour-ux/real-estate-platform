import { prisma } from "@/lib/db";
import { getAvailableSlots } from "@/modules/booking-system/broker-availability.service";
import { defaultSearchRange } from "@/modules/booking-system/broker-availability.service";

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

export type BestAvailableBrokerResult = {
  bestBrokerId: string | null;
  routingReason: string;
  availabilityScore: number;
  slotCount14d: number;
};

/**
 * Picks the listing owner broker when they have at least one open slot in the next window; otherwise same broker with explainable “busy” note.
 * Does not replace CRM assignment — assists scheduling only.
 */
export async function getBestAvailableBroker(input: {
  leadId: string;
  listingId: string;
}): Promise<BestAvailableBrokerResult> {
  const base = await resolveCentrisBrokerRouting(input.leadId);
  if (!base.bestBrokerId) {
    return {
      bestBrokerId: null,
      routingReason: base.routingReason,
      availabilityScore: 0,
      slotCount14d: 0,
    };
  }

  const { from, to } = defaultSearchRange();
  const [slots, settings, activePending, scheduledWindow] = await Promise.all([
    getAvailableSlots(base.bestBrokerId, { from, to }),
    prisma.lecipmBrokerBookingSettings.findUnique({
      where: { brokerUserId: base.bestBrokerId },
    }),
    prisma.lecipmVisitRequest.count({
      where: { brokerUserId: base.bestBrokerId, status: "pending" },
    }),
    prisma.lecipmVisit.count({
      where: {
        brokerUserId: base.bestBrokerId,
        status: { in: ["scheduled", "completed"] },
        endDateTime: { gte: from },
        startDateTime: { lte: to },
      },
    }),
  ]);
  const score = settings?.performanceScore ?? 0.7;
  const workloadPenalty = Math.min(0.25, (activePending * 0.04 + scheduledWindow * 0.01));
  const availabilityBoost = Math.min(0.2, slots.length * 0.02);
  const availabilityScore = Math.max(0, Math.min(1, score + availabilityBoost - workloadPenalty + 0.1));

  return {
    bestBrokerId: base.bestBrokerId,
    routingReason: `${base.routingReason} · Open slots: ${slots.length} · pending holds: ${activePending} · scheduled in window: ${scheduledWindow} (${settings?.timeZone ?? "default TZ"}).`,
    availabilityScore,
    slotCount14d: slots.length,
  };
}
