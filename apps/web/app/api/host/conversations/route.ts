import { getGuestId } from "@/lib/auth/session";
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";
import { getHostBookingConversationsOverview } from "@/lib/host/host-messaging-overview";

export const dynamic = "force-dynamic";

/**
 * GET /api/host/conversations — booking-scoped threads (`BookingMessage`) for this host only.
 */
export async function GET() {
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const conversations = await getHostBookingConversationsOverview(gate.userId);

  return Response.json({
    conversations,
    /** Deep link pattern used by BNHub inbox */
    bookingThreadPathTemplate: "/bnhub/booking/{bookingId}#messages",
  });
}
