/**
 * Party and nuisance control for BNHUB: signals and suggested actions.
 */

import { prisma } from "@/lib/db";

export interface PartyRiskSignals {
  shortStayBeforeWeekend: boolean;
  largeGuestCount: boolean;
  repeatedComplaintsFromListing: boolean;
  previousPartyIncidents: boolean;
  suspiciousPattern: boolean;
  riskScore: number; // 0-1
  suggestedAction: "none" | "manual_review" | "disable_instant_book" | "block_booking" | "monitor" | "suspend_listing";
}

/** Evaluate booking/listing for party risk. */
export async function evaluatePartyRisk(params: {
  listingId: string;
  bookingId?: string;
  guestCount?: number;
  checkIn: Date;
  nights: number;
}): Promise<PartyRiskSignals> {
  const listing = await prisma.shortTermListing.findUniqueOrThrow({
    where: { id: params.listingId },
    select: { id: true, maxGuests: true, instantBookEnabled: true },
  });

  const checkIn = new Date(params.checkIn);
  const dayOfWeek = checkIn.getDay(); // 0 Sun, 5 Fri, 6 Sat
  const isWeekendOrFriday = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
  const shortStayBeforeWeekend = params.nights <= 2 && isWeekendOrFriday;

  const guestCount = params.guestCount ?? listing.maxGuests;
  const largeGuestCount = Boolean(guestCount >= 6 || (listing.maxGuests != null && listing.maxGuests > 0 && guestCount >= listing.maxGuests - 1));

  const complaintCount = await prisma.trustSafetyIncident.count({
    where: {
      listingId: params.listingId,
      incidentCategory: "unauthorized_party",
    },
  });
  const repeatedComplaintsFromListing = complaintCount > 0;

  const partyIncidents = await prisma.trustSafetyIncident.count({
    where: {
      listingId: params.listingId,
      incidentCategory: "unauthorized_party",
      status: { notIn: ["CLOSED"] },
    },
  });
  const previousPartyIncidents = partyIncidents > 0;

  const suspiciousPattern = shortStayBeforeWeekend && largeGuestCount;

  let riskScore = 0;
  if (shortStayBeforeWeekend) riskScore += 0.2;
  if (largeGuestCount) riskScore += 0.2;
  if (repeatedComplaintsFromListing) riskScore += 0.3;
  if (previousPartyIncidents) riskScore += 0.4;
  if (suspiciousPattern) riskScore += 0.2;
  riskScore = Math.min(1, riskScore);

  let suggestedAction: PartyRiskSignals["suggestedAction"] = "none";
  if (riskScore >= 0.7 || previousPartyIncidents) suggestedAction = "suspend_listing";
  else if (riskScore >= 0.5) suggestedAction = "block_booking";
  else if (riskScore >= 0.4) suggestedAction = "manual_review";
  else if (riskScore >= 0.3 && listing.instantBookEnabled) suggestedAction = "disable_instant_book";
  else if (riskScore >= 0.2) suggestedAction = "monitor";

  return {
    shortStayBeforeWeekend,
    largeGuestCount,
    repeatedComplaintsFromListing,
    previousPartyIncidents,
    suspiciousPattern,
    riskScore,
    suggestedAction,
  };
}
