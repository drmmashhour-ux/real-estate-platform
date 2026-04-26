import { marketplacePrisma } from "@/lib/db";

import { toDateOnlyFromString } from "@/lib/dates/dateOnly";
import { requireAuth } from "@/lib/auth/middleware";
import { emit } from "@/lib/events";
import {
  activeMarketplaceInventoryFilter,
  computeHoldExpiry,
  whereBookingListOverlapsWindow,
  whereRangeBlocksListing,
} from "@/lib/marketplace/booking-hold";

export const dynamic = "force-dynamic";

class BookingDateConflictError extends Error {
  readonly code = "BOOKING_CONFLICT" as const;
  constructor() {
    super("Dates not available");
    this.name = "BookingDateConflictError";
  }
}

function isOverlapDbError(e: unknown): boolean {
  const s = String(e);
  if (s.includes("no_overlap_booking")) return true;
  if (s.includes("23P01")) return true; /* exclusion_violation (if re-enabled) */
  if (s.toLowerCase().includes("exclusion") && s.toLowerCase().includes("violation")) return true;
  return false;
}

/**
 * GET ?listingId= — reserved ranges for calendar / availability (Order D).
 * Aliases the same data as `GET /api/listings/:id/bookings`.
 * Optional: `&from=YYYY-MM-DD&to=YYYY-MM-DD` to scope results (Order 64).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId")?.trim();
  if (!listingId) {
    return Response.json({ error: "listingId is required" }, { status: 400 });
  }
  const fromParam = searchParams.get("from")?.trim();
  const toParam = searchParams.get("to")?.trim();

  let rangeFilter: ReturnType<typeof whereBookingListOverlapsWindow> | undefined;
  if (fromParam && toParam) {
    const from = toDateOnlyFromString(fromParam);
    const to = toDateOnlyFromString(toParam);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() > to.getTime()) {
      return Response.json({ error: "Invalid from/to date range" }, { status: 400 });
    }
    rangeFilter = whereBookingListOverlapsWindow(from, to);
  } else if (fromParam || toParam) {
    return Response.json({ error: "Both from and to are required when using a date range" }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: { listingId, ...activeMarketplaceInventoryFilter(), ...rangeFilter },
    select: { id: true, startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
  });
  return Response.json(bookings);
}

/**
 * Creates a `pending` hold (15m) + Stripe next; `confirmed` after webhook (Order 57).
 */
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || typeof user !== "object" || !("userId" in user)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (user as { userId: string }).userId;

  let body: { listingId?: string; startDate?: string; endDate?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.listingId?.trim() || !body.startDate || !body.endDate) {
    return Response.json(
      { error: "listingId, startDate, and endDate are required" },
      { status: 400 }
    );
  }

  const startDate = toDateOnlyFromString(body.startDate);
  const endDate = toDateOnlyFromString(body.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return Response.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (endDate <= startDate) {
    return Response.json({ error: "endDate must be after startDate" }, { status: 400 });
  }

  const listingId = body.listingId.trim();

  try {
    const booking = await marketplacePrisma.$transaction(async (tx) => {
      const holdExpiry = computeHoldExpiry();
      const conflict = await tx.booking.findFirst({
        where: whereRangeBlocksListing(listingId, startDate, endDate),
      });
      if (conflict) {
        throw new BookingDateConflictError();
      }
      return tx.booking.create({
        data: {
          userId,
          listingId,
          startDate,
          endDate,
          status: "pending",
          expiresAt: holdExpiry,
        },
      });
    });
    await emit("booking.created", {
      listingId,
      userId,
      bookingId: booking.id,
      source: "marketplace",
    });
    return Response.json(booking);
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return Response.json(
        {
          error: "A booking for these dates already exists. Refresh and try again.",
          code: "BOOKING_DUPLICATE",
        },
        { status: 409 }
      );
    }
    if (e instanceof BookingDateConflictError) {
      return Response.json(
        { error: "Dates not available", code: e.code },
        { status: 409 }
      );
    }
    if (isOverlapDbError(e)) {
      return Response.json(
        { error: "Dates not available", code: "BOOKING_CONFLICT" },
        { status: 409 }
      );
    }
    console.error("booking.create", e);
    return Response.json(
      { error: "Could not create booking", detail: String(e) },
      { status: 500 }
    );
  }
}
