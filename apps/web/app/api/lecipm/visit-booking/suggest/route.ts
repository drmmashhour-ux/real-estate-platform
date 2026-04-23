import { getGuestId } from "@/lib/auth/session";
import { assertVisitBookingAccess } from "@/lib/lecipm/visit-booking-access";
import { defaultSearchRange, getAvailableSlots } from "@/modules/booking-system/broker-availability.service";
import { groupSlotsForUi, formatSlotListForMessage } from "@/modules/booking-system/booking-calendar.service";
import { getBestAvailableBroker } from "@/modules/centris-conversion/centris-broker-routing.service";

export const dynamic = "force-dynamic";

/**
 * POST — returns real open slots (LECIPM visit engine) for the lead’s listing broker.
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const leadId = typeof body.leadId === "string" ? body.leadId : "";
  const listingId = typeof body.listingId === "string" ? body.listingId : "";
  if (!leadId || !listingId) {
    return Response.json({ error: "leadId and listingId required" }, { status: 400 });
  }
  const gate = await assertVisitBookingAccess({ userId, leadId, listingId });
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }

  const best = await getBestAvailableBroker({ leadId, listingId });
  if (!best.bestBrokerId) {
    return Response.json({
      kind: "lecipm_visit_booking_suggest_v1",
      brokerId: null,
      slots: [],
      message: "",
      formattedMessage: "No open automated slots — a broker will follow up.",
      routingReason: best.routingReason,
    });
  }
  const { from, to } = defaultSearchRange();
  const raw = await getAvailableSlots(best.bestBrokerId, { from, to });
  const ui = groupSlotsForUi(raw);
  return Response.json({
    kind: "lecipm_visit_booking_suggest_v1",
    brokerId: best.bestBrokerId,
    slots: ui,
    message: formatSlotListForMessage(ui),
    formattedMessage: `I can help you schedule a visit. Here are a few available times:\n\n${formatSlotListForMessage(ui)}\n\nWhich works best for you?`,
    routingReason: best.routingReason,
  });
}
