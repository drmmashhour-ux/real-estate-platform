/**
 * Stay suggestions from prior behavior — deterministic, explainable.
 */
import { BookingStatus, ListingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { GuestBehaviorProfile } from "./types";

export type StayCard = {
  id: string;
  listingCode: string;
  title: string;
  city: string;
  nightPriceCents: number;
  currency: string;
};

export type RecommendationBundle = {
  similarStays: StayCard[];
  previousDestinationStays: StayCard[];
  explanation: string[];
};

function cardSelect() {
  return {
    id: true,
    listingCode: true,
    title: true,
    city: true,
    nightPriceCents: true,
    currency: true,
  } as const;
}

export async function buildStayRecommendations(
  userId: string,
  profile: GuestBehaviorProfile,
  limit = 6
): Promise<RecommendationBundle> {
  const explanation: string[] = [];

  const lastViewed = await prisma.userBehaviorEvent.findFirst({
    where: { userId, listingId: { not: null }, eventType: "LISTING_CLICK" },
    orderBy: { createdAt: "desc" },
    select: { listingId: true, listing: { select: { city: true } } },
  });

  const cityFromViews = lastViewed?.listing?.city?.trim() || profile.bookingCities[0] || null;

  let similarStays: StayCard[] = [];
  if (cityFromViews) {
    similarStays = await prisma.shortTermListing.findMany({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        city: { equals: cityFromViews, mode: "insensitive" },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: cardSelect(),
    });
    explanation.push(`Similar stays: same city as recent interest (${cityFromViews}).`);
  } else {
    explanation.push("Similar stays: skipped — no recent city signal.");
  }

  const lastBooking = await prisma.booking.findFirst({
    where: { guestId: userId, status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
    orderBy: { checkIn: "desc" },
    select: { listingId: true, listing: { select: { city: true } } },
  });

  let previousDestinationStays: StayCard[] = [];
  if (lastBooking?.listing?.city) {
    const dest = lastBooking.listing.city.trim();
    previousDestinationStays = await prisma.shortTermListing.findMany({
      where: {
        listingStatus: ListingStatus.PUBLISHED,
        city: { equals: dest, mode: "insensitive" },
        NOT: { id: lastBooking.listingId },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: cardSelect(),
    });
    explanation.push(`Previous destination ideas: based on your last stay in ${dest}.`);
  } else {
    explanation.push("Previous destination: skipped — no completed stay city.");
  }

  return { similarStays, previousDestinationStays, explanation };
}
