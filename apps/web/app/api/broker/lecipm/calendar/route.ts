import { prisma } from "@/lib/db";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

/**
 * GET — upcoming LECIPM listing visits and pending holds for the signed-in broker.
 */
export async function GET() {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const from = new Date();
  const to = new Date(from.getTime() + 30 * 86400000);

  const [visits, holds] = await Promise.all([
    prisma.lecipmVisit.findMany({
      where: {
        brokerUserId: auth.userId,
        status: "scheduled",
        endDateTime: { gte: from },
        startDateTime: { lte: to },
      },
      orderBy: { startDateTime: "asc" },
      take: 100,
      include: {
        listing: { select: { id: true, title: true } },
      },
    }),
    prisma.lecipmVisitRequest.findMany({
      where: {
        brokerUserId: auth.userId,
        status: "pending",
        OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gte: new Date() } }],
        requestedEnd: { gte: from },
      },
      orderBy: { requestedStart: "asc" },
      take: 50,
      include: {
        listing: { select: { id: true, title: true } },
        lead: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
  ]);

  const leadIds = Array.from(
    new Set([...visits.map((v) => v.leadId), ...holds.map((h) => h.leadId)]),
  );
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const leadById = new Map(leads.map((l) => [l.id, l] as const));

  return Response.json({
    kind: "broker_lecipm_calendar_v1",
    visits: visits.map((v) => ({
      id: v.id,
      start: v.startDateTime.toISOString(),
      end: v.endDateTime.toISOString(),
      listing: v.listing,
      lead: leadById.get(v.leadId) ?? null,
      reconfirmedAt: v.reconfirmedAt?.toISOString() ?? null,
      noShowRiskBand: v.noShowRiskBand,
      noShowRiskScore: v.noShowRiskScore,
      workflowState: v.workflowState,
    })),
    holds: holds.map((h) => ({
      visitRequestId: h.id,
      start: h.requestedStart.toISOString(),
      end: h.requestedEnd.toISOString(),
      holdExpiresAt: h.holdExpiresAt?.toISOString() ?? null,
      listing: h.listing,
      lead: h.lead,
    })),
  });
}

/** POST block time — reuses LecipmBrokerTimeOff; minimal broker-only surface. */
export async function POST(request: Request) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const body = await request.json().catch(() => ({}));
  if (body.action === "time_off") {
    const start = typeof body.start === "string" ? new Date(body.start) : null;
    const end = typeof body.end === "string" ? new Date(body.end) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return Response.json({ error: "start and end (ISO) required" }, { status: 400 });
    }
    const row = await prisma.lecipmBrokerTimeOff.create({
      data: {
        brokerUserId: auth.userId,
        startDateTime: start,
        endDateTime: end,
        reason: typeof body.reason === "string" ? body.reason : "blocked in calendar UI",
      },
    });
    return Response.json({ ok: true, id: row.id });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
