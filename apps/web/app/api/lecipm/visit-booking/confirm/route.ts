import { getGuestId } from "@/lib/auth/session";
import { assertVisitBookingAccess } from "@/lib/lecipm/visit-booking-access";
import { confirmVisitBooking } from "@/modules/booking-system/booking-engine.service";
import { prisma } from "@/lib/db";
import { sendAdminHighValueAlert } from "@/modules/booking-system/booking-notification.service";
import type { LecipmVisitSourceTag } from "@/modules/booking-system/booking.types";

export const dynamic = "force-dynamic";

const SOURCES: LecipmVisitSourceTag[] = ["CENTRIS", "DIRECT", "AI_CLOSER", "MOBILE"];

/**
 * POST — final user confirmation: creates `LecipmVisit`, updates CRM, sends emails.
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const visitRequestId = typeof body.visitRequestId === "string" ? body.visitRequestId : "";
  const userConfirmed = body.userConfirmed === true;
  const source =
    typeof body.source === "string" && (SOURCES as string[]).includes(body.source)
      ? (body.source as LecipmVisitSourceTag)
      : "DIRECT";
  if (!visitRequestId) {
    return Response.json({ error: "visitRequestId required" }, { status: 400 });
  }
  if (!userConfirmed) {
    return Response.json({ error: "userConfirmed must be true" }, { status: 400 });
  }
  const req = await prisma.lecipmVisitRequest.findUnique({
    where: { id: visitRequestId },
    select: { leadId: true, listingId: true },
  });
  if (!req) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const gate = await assertVisitBookingAccess({ userId, leadId: req.leadId, listingId: req.listingId });
  if (!gate.ok) {
    return Response.json({ error: gate.error }, { status: gate.status });
  }

  const out = await confirmVisitBooking({ visitRequestId, userConfirmed, source });
  if (!out.ok) {
    const status = out.code === "not_found" ? 404 : out.code === "conflict" ? 409 : 400;
    return Response.json({ error: out.error, code: out.code }, { status });
  }

  const lead = await prisma.lead.findUnique({
    where: { id: req.leadId },
    select: { estimatedValue: true, name: true },
  });
  const highValue = (lead?.estimatedValue ?? 0) >= 1_000_000;
  const adminEmail = process.env.LECIPM_PLATFORM_ALERTS_EMAIL;
  if (highValue && adminEmail) {
    void sendAdminHighValueAlert({
      leadName: lead?.name ?? "Lead",
      listingTitle: null,
      when: new Date().toISOString(),
      adminEmail,
    });
  }

  return Response.json({
    kind: "lecipm_visit_booking_confirm_v1",
    visitRequestId: out.visitRequestId,
    visitId: out.visitId,
  });
}
