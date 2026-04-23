import { getGuestId } from "@/lib/auth/session";
import { assertVisitBookingAccess } from "@/lib/lecipm/visit-booking-access";
import { reserveSlot } from "@/modules/booking-system/broker-availability.service";
import type { LecipmVisitSourceTag } from "@/modules/booking-system/booking.types";

export const dynamic = "force-dynamic";

const SOURCES: LecipmVisitSourceTag[] = ["CENTRIS", "DIRECT", "AI_CLOSER", "MOBILE"];

/**
 * POST — soft-hold a slot (user picked a time; not confirmed until `/confirm`).
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  const brokerId = typeof body.brokerId === "string" ? body.brokerId : "";
  const start = typeof body.start === "string" ? new Date(body.start) : null;
  const end = typeof body.end === "string" ? new Date(body.end) : null;
  const source =
    typeof body.source === "string" && (SOURCES as string[]).includes(body.source)
      ? (body.source as LecipmVisitSourceTag)
      : "DIRECT";
  if (!leadId || !listingId || !brokerId || !start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return Response.json({ error: "leadId, listingId, brokerId, start, end (ISO) required" }, { status: 400 });
  }
  const gate = await assertVisitBookingAccess({ userId, leadId, listingId });
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }
  const res = await reserveSlot({
    leadId,
    listingId,
    brokerId,
    start,
    end,
    visitSource: source,
    customerUserId: userId,
  });
  if (!res.ok) {
    return Response.json({ error: res.error, code: "unavailable" }, { status: 409 });
  }
  return Response.json({ kind: "lecipm_visit_booking_hold_v1", visitRequestId: res.visitRequestId });
}
