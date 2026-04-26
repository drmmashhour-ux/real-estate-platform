import { marketplacePrisma } from "@/lib/db";

import { toDateOnlyFromString } from "@/lib/dates/dateOnly";
import {
  activeMarketplaceInventoryFilter,
  whereBookingListOverlapsWindow,
} from "@/lib/marketplace/booking-hold";

export const dynamic = "force-dynamic";

/**
 * Public availability: existing `Booking` ranges for this listing (marketplace `bookings` table).
 * Path is under `/api/listings/...` to avoid clashing with `GET /api/bookings/[id]` (single booking by id).
 *
 * Optional: `?from=YYYY-MM-DD&to=YYYY-MM-DD` — only return bookings overlapping that window (Order 64).
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await context.params;
  if (!listingId?.trim()) {
    return Response.json({ error: "listingId required" }, { status: 400 });
  }

  const listingsId = listingId.trim();
  const { searchParams } = new URL(req.url);
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

  const bookings = await marketplacePrisma.booking.findMany({
    where: {
      listingId: listingsId,
      ...activeMarketplaceInventoryFilter(),
      ...rangeFilter,
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: "asc" },
  });

  return Response.json(bookings);
}
