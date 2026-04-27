import { getListingsDB, monolithPrisma, prisma } from "@/lib/db";
import type { RiskInput } from "./riskEngine";

export type RiskDataContext = RiskInput & {
  /** Monolith `Listing.id` for marketplace rows only (same as `listings` id in Listings DB). */
  crmListingId?: string;
  /** Best-effort guest / booker (marketplace: booking.userId, BNHub: guest). */
  userId?: string | null;
};

/**
 * Builds {@link RiskInput} from a `booking.created` payload and light DB reads (best-effort).
 * Marketplace uses `listings` `Booking`; BNHub uses monolith `Booking` + `ShortTermListing`.
 */
export async function getRiskDataFromBookingEvent(raw: Record<string, unknown>): Promise<RiskDataContext | null> {
  const listingId = typeof raw.listingId === "string" && raw.listingId.trim() ? raw.listingId.trim() : null;
  if (!listingId) {
    return null;
  }

  const bookingId = typeof raw.bookingId === "string" && raw.bookingId.trim() ? raw.bookingId.trim() : null;
  const source = raw.source === "bnhub" ? "bnhub" : "marketplace";

  let userId: string | null =
    typeof raw.userId === "string" && raw.userId.trim() ? raw.userId.trim() : null;
  let bookingsLast24h = 0;
  let price: number | undefined;
  const since = new Date(Date.now() - 86_400_000);

  if (source === "marketplace" && bookingId) {
    const b = await getListingsDB().booking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    });
    if (b?.userId) {
      userId = b.userId;
    }
    const listing = await getListingsDB().listing.findUnique({
      where: { id: listingId },
      select: { price: true },
    });
    price = listing?.price != null ? Number(listing.price) : undefined;
    if (userId) {
      bookingsLast24h = await getListingsDB().booking.count({
        where: { userId, createdAt: { gte: since } },
      });
    }
  } else if (source === "bnhub" && bookingId) {
    const b = await monolithPrisma.booking.findUnique({
      where: { id: bookingId },
      select: { guestId: true },
    });
    if (b?.guestId) {
      userId = b.guestId;
    }
    const st = await monolithPrisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { nightPriceCents: true },
    });
    price = st?.nightPriceCents != null ? st.nightPriceCents / 100 : undefined;
    if (userId) {
      bookingsLast24h = await monolithPrisma.booking.count({
        where: { guestId: userId, createdAt: { gte: since } },
      });
    }
  } else if (source === "marketplace") {
    const listing = await getListingsDB().listing.findUnique({
      where: { id: listingId },
      select: { price: true },
    });
    price = listing?.price != null ? Number(listing.price) : undefined;
    if (userId) {
      bookingsLast24h = await getListingsDB().booking.count({
        where: { userId, createdAt: { gte: since } },
      });
    }
  } else if (source === "bnhub") {
    const st = await monolithPrisma.shortTermListing.findUnique({
      where: { id: listingId },
      select: { nightPriceCents: true },
    });
    price = st?.nightPriceCents != null ? st.nightPriceCents / 100 : undefined;
    if (userId) {
      bookingsLast24h = await monolithPrisma.booking.count({
        where: { guestId: userId, createdAt: { gte: since } },
      });
    }
  }

  let userAgeDays: number | undefined;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    if (u) {
      userAgeDays = (Date.now() - u.createdAt.getTime()) / 86_400_000;
    }
  }

  const crmListingId = source === "marketplace" ? listingId : undefined;

  return {
    price,
    marketPrice: undefined,
    userAgeDays,
    bookingsLast24h,
    ipReputation: undefined,
    crmListingId,
    userId,
  };
}
