import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * LECIPM listing visits (not BNHub stays). Path: `/api/mobile/bookings/upcoming`
 */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const from = new Date();
  const to = new Date(from.getTime() + 45 * 86400000);

  if (user.role === PlatformRole.BROKER || user.role === PlatformRole.ADMIN) {
    const visits = await prisma.lecipmVisit.findMany({
      where: { brokerUserId: user.id, status: "scheduled", endDateTime: { gte: from }, startDateTime: { lte: to } },
      orderBy: { startDateTime: "asc" },
      take: 40,
      include: { listing: { select: { id: true, title: true } } },
    });
    const leadIds = Array.from(new Set(visits.map((v) => v.leadId)));
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, name: true, email: true, phone: true },
    });
    const lm = new Map(leads.map((l) => [l.id, l] as const));
    return Response.json({
      kind: "mobile_lecipm_upcoming_v1",
      role: "broker",
      visits: visits.map((v) => ({
        id: v.id,
        start: v.startDateTime.toISOString(),
        end: v.endDateTime.toISOString(),
        noShowRiskBand: v.noShowRiskBand,
        noShowRiskScore: v.noShowRiskScore,
        reconfirmedAt: v.reconfirmedAt?.toISOString() ?? null,
        workflowState: v.workflowState,
        listing: v.listing,
        lead: lm.get(v.leadId) ?? null,
      })),
    });
  }

  const visits = await prisma.lecipmVisit.findMany({
    where: {
      lead: { userId: user.id },
      status: "scheduled",
      endDateTime: { gte: from },
      startDateTime: { lte: to },
    },
    orderBy: { startDateTime: "asc" },
    take: 20,
    include: { listing: { select: { id: true, title: true } } },
  });
  return Response.json({
    kind: "mobile_lecipm_upcoming_v1",
    role: "lead",
    visits: visits.map((v) => ({
      id: v.id,
      start: v.startDateTime.toISOString(),
      end: v.endDateTime.toISOString(),
      noShowRiskBand: v.noShowRiskBand,
      noShowRiskScore: v.noShowRiskScore,
      reconfirmedAt: v.reconfirmedAt?.toISOString() ?? null,
      workflowState: v.workflowState,
      listing: v.listing,
    })),
  });
}
