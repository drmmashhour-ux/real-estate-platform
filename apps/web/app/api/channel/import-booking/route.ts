import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { importExternalChannelBooking } from "@/modules/channel-manager/channel-sync.service";
import { logApiRouteError } from "@/lib/api/dev-log";

export const dynamic = "force-dynamic";

/**
 * POST /api/channel/import-booking — host records an off-platform reservation in BNHub.
 * Body: { listingId, checkIn, checkOut, startDate?, endDate?, externalSource?, guestName? }
 * (startDate/endDate accepted as aliases for checkIn/checkOut.)
 */
export async function POST(req: Request) {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
    const checkInRaw =
      typeof body.checkIn === "string"
        ? body.checkIn.trim()
        : typeof body.startDate === "string"
          ? body.startDate.trim()
          : "";
    const checkOutRaw =
      typeof body.checkOut === "string"
        ? body.checkOut.trim()
        : typeof body.endDate === "string"
          ? body.endDate.trim()
          : "";

    if (!listingId || !checkInRaw || !checkOutRaw) {
      return NextResponse.json(
        { error: "listingId and check-in / check-out (or startDate / endDate) required" },
        { status: 400 }
      );
    }

    const externalSource =
      typeof body.externalSource === "string" ? body.externalSource.trim() : undefined;
    const guestDisplayName =
      typeof body.guestName === "string"
        ? body.guestName.trim()
        : typeof body.guestDisplayName === "string"
          ? body.guestDisplayName.trim()
          : undefined;

    const result = await importExternalChannelBooking({
      actorHostUserId: userId,
      listingId,
      checkInIso: checkInRaw,
      checkOutIso: checkOutRaw,
      externalSource,
      guestDisplayName,
    });

    return NextResponse.json({ ok: true, bookingId: result.bookingId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "CONFLICT") {
      return NextResponse.json({ error: "Conflict detected" }, { status: 409 });
    }
    if (msg.includes("Listing not found") || msg.includes("access denied")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    if (msg.includes("Invalid") || msg.includes("pricing")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    logApiRouteError("POST /api/channel/import-booking", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
