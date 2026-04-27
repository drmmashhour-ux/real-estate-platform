import { getListingsDB } from "@/lib/db/routeSwitch";
import { MAX_CALENDAR_RANGE_DAYS } from "@/lib/booking/dailyCalendarQuery";
import { getBookingPriceBreakdown } from "@/lib/booking/pricing";
import { buildMarketplaceConflictSuggestions } from "@/lib/booking/availabilityHelpers";
import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";
import { requireAuth } from "@/lib/auth/middleware";
import { toDateOnlyFromString } from "@/lib/dates/dateOnly";
import { computeHoldExpiry, whereBookingListOverlapsWindow, whereRangeBlocksListing } from "@/lib/marketplace/booking-hold";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { getClientIpFromRequest } from "@/lib/security/ip-fingerprint";
import { logApi } from "@/lib/observability/structured-log";
import { isDemoDataActive, isDemoListingId, parseDemoScenarioFromRequest } from "@/lib/demo/mode";
import { getDemoBookings, getDemoBookingPriceBreakdown } from "@/lib/demo/data";
import { calculateDynamicTotal } from "@/lib/pricing/calculateDynamicTotal";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

class BookingDateConflictError extends Error {
  constructor() {
    super("Dates not available");
    this.name = "BookingDateConflictError";
  }
}

/**
 * GET /api/bookings — optional `?listingId=` and `?start=YYYY-MM-DD&end=YYYY-MM-DD` (both required for range filter).
 */
export async function GET(req: Request) {
  const ip = getClientIpFromRequest(req);
  const rl = checkRateLimit(`bookings-get:${ip}`, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", ...getRateLimitHeaders(rl) },
    });
  }

  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId")?.trim();
  const startParam = searchParams.get("start")?.trim();
  const endParam = searchParams.get("end")?.trim();

  if ((startParam && !endParam) || (!startParam && endParam)) {
    return Response.json({ error: "Both start and end are required for date filtering" }, { status: 400 });
  }

  if (isDemoDataActive(req)) {
    let rows = getDemoBookings(parseDemoScenarioFromRequest(req));
    if (listingId) {
      rows = rows.filter((b) => b.listingId === listingId);
    }
    return Response.json(rows);
  }

  const db = getListingsDB();
  logApi("bookings_list");

  const where: {
    listingId?: string;
    startDate?: { lte: Date };
    endDate?: { gte: Date };
  } = {};
  if (listingId) {
    where.listingId = listingId;
  }

  if (startParam && endParam) {
    const from = toDateOnlyFromString(startParam);
    const to = toDateOnlyFromString(endParam);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from.getTime() > to.getTime()) {
      return Response.json({ error: "Invalid start/end date range" }, { status: 400 });
    }
    Object.assign(where, whereBookingListOverlapsWindow(from, to));
  }

  const take = listingId || (startParam && endParam) ? 200 : 20;

  const bookings = await db.booking.findMany({
    where,
    take,
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      listingId: true,
      userId: true,
      startDate: true,
      endDate: true,
      status: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return Response.json(bookings);
}

/**
 * POST /api/bookings — create pending marketplace hold (same rules as checkout booking leg).
 * Order D.1: on conflict, **409** with `error: "Dates not available"`, `code: "BOOKING_CONFLICT"`, and
 * `suggestions` (optional for older clients; when present, `nextAvailableStart` + `nearestRanges`).
 * Existing 201/400/404 keys unchanged.
 */
export async function POST(req: Request) {
  const ip = getClientIpFromRequest(req);
  const rl = checkRateLimit(`bookings-post:${ip}`, { windowMs: 60_000, max: 30 });
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", ...getRateLimitHeaders(rl) },
    });
  }

  const user = requireAuth(req);
  if (!user || typeof user !== "object" || !("userId" in user)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (user as { userId: string }).userId;

  let body: { listingId?: unknown; startDate?: unknown; endDate?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const listingIdRaw = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const startRaw = typeof body.startDate === "string" ? body.startDate.trim() : "";
  const endRaw = typeof body.endDate === "string" ? body.endDate.trim() : "";

  if (!listingIdRaw || !startRaw || !endRaw) {
    return Response.json({ error: "listingId, startDate, and endDate are required" }, { status: 400 });
  }

  const startDate = toDateOnlyFromString(startRaw);
  const endDate = toDateOnlyFromString(endRaw);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return Response.json({ error: "Invalid startDate or endDate" }, { status: 400 });
  }
  if (endDate <= startDate) {
    return Response.json({ error: "endDate must be after startDate" }, { status: 400 });
  }

  const startYmdEarly = startRaw.slice(0, 10);
  const endYmdEarly = endRaw.slice(0, 10);
  const nightKeysEarly = nightYmdKeysForStay(startYmdEarly, endYmdEarly);
  if (nightKeysEarly.length > MAX_CALENDAR_RANGE_DAYS) {
    return Response.json(
      { error: `Stay must be at most ${MAX_CALENDAR_RANGE_DAYS} nights` },
      { status: 400 }
    );
  }

  if (isDemoDataActive(req) && isDemoListingId(listingIdRaw)) {
    const scenario = parseDemoScenarioFromRequest(req);
    const startYmd = startYmdEarly;
    const endYmd = endYmdEarly;
    const priceBreakdown = getDemoBookingPriceBreakdown(listingIdRaw, startYmd, endYmd, scenario);
    if (!priceBreakdown) {
      return Response.json({ error: "Could not price this stay" }, { status: 400 });
    }
    if (!priceBreakdown.allNightsAvailable) {
      return Response.json(
        {
          error: "Dates not available",
          code: "BOOKING_CONFLICT",
          suggestions: { nextAvailableStart: null, nearestRanges: [] as { startDate: string; endDate: string }[] },
          priceBreakdown,
          demo: true,
        },
        { status: 409 }
      );
    }
    return Response.json(
      {
        id: `demo-bk-${crypto.randomUUID()}`,
        listingId: listingIdRaw,
        priceBreakdown,
        holdExpiresAt: computeHoldExpiry().toISOString(),
        demo: true,
      },
      { status: 201 }
    );
  }

  const listDb = getListingsDB();
  const listing = await listDb.listing.findUnique({
    where: { id: listingIdRaw },
    select: { id: true },
  });
  if (!listing) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  const startYmd = startYmdEarly;
  const endYmd = endYmdEarly;

  const priceBreakdown = await getBookingPriceBreakdown({
    listingId: listingIdRaw,
    startDate: startYmd,
    endDate: endYmd,
  });
  if (!priceBreakdown) {
    return Response.json({ error: "Could not price this stay" }, { status: 400 });
  }
  if (!priceBreakdown.allNightsAvailable) {
    const suggestions = await buildMarketplaceConflictSuggestions(listingIdRaw, startYmd, endYmd);
    return Response.json(
      {
        error: "Dates not available",
        code: "BOOKING_CONFLICT",
        suggestions: {
          nextAvailableStart: suggestions.nextAvailableStart,
          nearestRanges: suggestions.nearestRanges,
        },
        priceBreakdown,
      },
      { status: 409 }
    );
  }

  const dynamicTotal = await calculateDynamicTotal({ listingId: listingIdRaw, startDate: startYmd, endDate: endYmd });
  if (dynamicTotal) {
    void trackEvent("booking_priced_dynamic", {
      listingId: listingIdRaw,
      finalCents: dynamicTotal.finalCents,
    }).catch(() => {});
  }

  try {
    const created = await listDb.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: whereRangeBlocksListing(listingIdRaw, startDate, endDate),
      });
      if (conflict) {
        throw new BookingDateConflictError();
      }
      return tx.booking.create({
        data: {
          userId,
          listingId: listingIdRaw,
          startDate,
          endDate,
          status: "pending",
          expiresAt: computeHoldExpiry(),
          ...(dynamicTotal
            ? {
                subtotalCents: dynamicTotal.subtotalCents,
                feeCents: dynamicTotal.platformFeeCents,
                finalCents: dynamicTotal.finalCents,
                nights: dynamicTotal.nights,
                pricingSnapshot: {
                  v: 1,
                  source: "order_61",
                  nightlyPrices: dynamicTotal.nightlyPrices,
                },
              }
            : {}),
        },
      });
    });

    void import("@/lib/events")
      .then((m) =>
        m.emit("booking.created", {
          listingId: listingIdRaw,
          bookingId: created.id,
          userId,
          source: "marketplace",
        })
      )
      .catch(() => {});

    return Response.json(
      {
        id: created.id,
        listingId: listingIdRaw,
        priceBreakdown,
        holdExpiresAt: created.expiresAt?.toISOString() ?? null,
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof BookingDateConflictError) {
      const suggestions = await buildMarketplaceConflictSuggestions(listingIdRaw, startYmd, endYmd);
      return Response.json(
        {
          error: e.message,
          code: "BOOKING_CONFLICT",
          suggestions: {
            nextAvailableStart: suggestions.nextAvailableStart,
            nearestRanges: suggestions.nearestRanges,
          },
          priceBreakdown,
        },
        { status: 409 }
      );
    }
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return Response.json(
        { error: "A booking for these dates already exists. Refresh and try again.", code: "BOOKING_DUPLICATE" },
        { status: 409 }
      );
    }
    if (isOverlapDbError(e)) {
      const suggestions = await buildMarketplaceConflictSuggestions(listingIdRaw, startYmd, endYmd);
      return Response.json(
        {
          error: "Dates not available",
          code: "BOOKING_CONFLICT",
          suggestions: {
            nextAvailableStart: suggestions.nextAvailableStart,
            nearestRanges: suggestions.nearestRanges,
          },
          priceBreakdown,
        },
        { status: 409 }
      );
    }
    console.error("POST /api/bookings", e);
    return Response.json({ error: "Could not create booking" }, { status: 500 });
  }
}
