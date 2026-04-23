import { requireMobileBrokerUser } from "@/lib/mobile/require-mobile-broker";
import { prisma } from "@/lib/db";
import { cancelPendingVisitRequest, cancelScheduledVisit } from "@/modules/booking-system/booking-engine.service";

export const dynamic = "force-dynamic";

/**
 * Mobile LECIPM visit pipeline — not BNHub `Booking` stays.
 * Path: `/api/mobile/lecipm/bookings`
 */
export async function GET(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const from = new Date();
  const to = new Date(from.getTime() + 30 * 86400000);
  const visits = await prisma.lecipmVisit.findMany({
    where: {
      brokerUserId: auth.user.id,
      status: "scheduled",
      endDateTime: { gte: from },
    },
    orderBy: { startDateTime: "asc" },
    take: 50,
    include: { listing: { select: { id: true, title: true } } },
  });
  const leadIds = Array.from(new Set(visits.map((v) => v.leadId)));
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const leadBy = new Map(leads.map((l) => [l.id, l] as const));
  return Response.json({
    kind: "mobile_lecipm_bookings_v1",
    visits: visits.map((v) => ({
      id: v.id,
      start: v.startDateTime.toISOString(),
      end: v.endDateTime.toISOString(),
      listing: v.listing,
      lead: leadBy.get(v.leadId) ?? null,
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireMobileBrokerUser(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => ({}));
  if (body.action === "decline_hold" && typeof body.visitRequestId === "string") {
    const vr = await prisma.lecipmVisitRequest.findFirst({
      where: { id: body.visitRequestId, brokerUserId: auth.user.id, status: "pending" },
      select: { id: true },
    });
    if (!vr) {
      return Response.json({ error: "No pending request for you" }, { status: 404 });
    }
    const r = await cancelPendingVisitRequest({ visitRequestId: body.visitRequestId });
    if (!r.ok) {
      return Response.json({ error: r.error }, { status: 400 });
    }
    return Response.json({ ok: true });
  }
  if (body.action === "cancel_visit" && typeof body.visitId === "string") {
    const r = await cancelScheduledVisit({ visitId: body.visitId, actorUserId: auth.user.id });
    if (!r.ok) {
      return Response.json({ error: r.error }, { status: 400 });
    }
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Invalid action" }, { status: 400 });
}
