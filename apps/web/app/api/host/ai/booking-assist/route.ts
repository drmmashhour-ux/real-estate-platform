import { getGuestId } from "@/lib/auth/session";
import { isReasonableListingId } from "@/lib/api/safe-params";
import { requireBnhubHostAccess } from "@/lib/host/require-bnhub-host-access";
import { logHostAi } from "@/modules/host-ai/host-ai.logger";
import { suggestBookingAssistance } from "@/modules/host-ai/booking-assistant";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

/**
 * GET /api/host/ai/booking-assist?bookingId= — advisory triage only (no booking mutations).
 */
export async function GET(req: Request) {
  const userId = await getGuestId();
  const gate = await requireBnhubHostAccess(userId);
  if (!gate.ok) return Response.json({ error: gate.error }, { status: gate.status });

  const bookingId = new URL(req.url).searchParams.get("bookingId")?.trim() ?? "";
  if (!bookingId || !isReasonableListingId(bookingId)) {
    return Response.json({ error: "bookingId required" }, { status: 400 });
  }

  const b = await prisma.booking.findFirst({
    where: { id: bookingId, listing: { ownerId: gate.userId } },
    select: {
      status: true,
      nights: true,
      checkIn: true,
      checkOut: true,
      totalCents: true,
      guestNotes: true,
      specialRequest: true,
      listing: { select: { title: true, partyAllowed: true, petsAllowed: true } },
      payment: { select: { status: true } },
      bookingEvents: { select: { eventType: true, payload: true }, take: 40 },
    },
  });
  if (!b) return Response.json({ error: "Not found" }, { status: 404 });

  const trustEv = b.bookingEvents.find((e) => e.eventType === "guest_trust_evaluated");
  let guestTrustRiskLevel: "LOW" | "MEDIUM" | "HIGH" | null = null;
  if (trustEv?.payload != null && typeof trustEv.payload === "object" && !Array.isArray(trustEv.payload)) {
    const r = (trustEv.payload as Record<string, unknown>).riskLevel;
    if (r === "LOW" || r === "MEDIUM" || r === "HIGH") guestTrustRiskLevel = r;
  }

  const result = suggestBookingAssistance({
    status: b.status,
    nights: b.nights,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    totalCents: b.totalCents,
    guestNotes: b.guestNotes,
    specialRequest: b.specialRequest,
    listingTitle: b.listing.title,
    listingPartyAllowed: b.listing.partyAllowed,
    listingPetsAllowed: b.listing.petsAllowed,
    paymentStatus: b.payment?.status ?? null,
    guestTrustRiskLevel,
  });

  logHostAi("booking_suggestion", {
    bookingId: bookingId.slice(0, 8),
    action: result.suggestedAction,
    riskCount: result.risks.length,
  });

  return Response.json({
    bookingId,
    ...result,
    transparency: { hostDecides: true, noAutoApply: true },
  });
}
