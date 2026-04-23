import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** High-risk scheduled visits (broker/admin). */
export async function GET() {
  const userId = await getGuestId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return Response.json({ error: "Broker access required" }, { status: 403 });
  }
  const from = new Date();
  const visits = await prisma.lecipmVisit.findMany({
    where: {
      brokerUserId: user.id,
      status: "scheduled",
      noShowRiskBand: "HIGH",
      endDateTime: { gte: from },
    },
    orderBy: { startDateTime: "asc" },
    take: 30,
    include: { listing: { select: { title: true } } },
  });
  const leadIds = Array.from(new Set(visits.map((v) => v.leadId)));
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, name: true, email: true, phone: true },
  });
  const lm = new Map(leads.map((l) => [l.id, l] as const));
  return Response.json({
    kind: "mobile_lecipm_high_risk_v1",
    visits: visits.map((v) => ({
      id: v.id,
      start: v.startDateTime.toISOString(),
      reconfirmedAt: v.reconfirmedAt?.toISOString() ?? null,
      noShowRiskScore: v.noShowRiskScore,
      listing: v.listing,
      lead: lm.get(v.leadId) ?? null,
    })),
  });
}
