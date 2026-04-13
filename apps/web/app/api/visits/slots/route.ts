import { NextRequest, NextResponse } from "next/server";
import { resolveBrokerForListing } from "@/lib/messages/resolve-broker-for-listing";
import { getAvailableVisitSlots } from "@/lib/visits/get-available-slots";
import { parseISODate } from "@/lib/visits/validators";

export const dynamic = "force-dynamic";

/** Public: available visit slots for a listing (uses broker availability + existing calendar). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const durationRaw = searchParams.get("durationMinutes");

  if (!listingId?.trim()) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  const from = parseISODate(fromRaw ?? "");
  const to = parseISODate(toRaw ?? "");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to must be valid ISO dates" }, { status: 400 });
  }

  const brokerUserId = await resolveBrokerForListing(listingId, null);
  if (!brokerUserId) {
    return NextResponse.json({ error: "Could not resolve broker for listing" }, { status: 404 });
  }

  const durationMinutes = durationRaw ? parseInt(durationRaw, 10) : undefined;

  const slots = await getAvailableVisitSlots({
    brokerUserId,
    from,
    to,
    durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : undefined,
  });

  return NextResponse.json({ slots });
}
