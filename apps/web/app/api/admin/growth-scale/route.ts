import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const id = await getGuestId();
  if (!id) return { ok: false as const, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admin only" };
  return { ok: true as const };
}

/** GET — funnel snapshot: traffic events, leads, rough revenue proxy (platform payments). */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    traffic7d,
    traffic30d,
    pageViews7d,
    growthCta7d,
    leads7d,
    leads30d,
    mortgageLeads7d,
    revenue30d,
    evalSessionsOpen,
  ] = await Promise.all([
    prisma.trafficEvent.count({ where: { createdAt: { gte: day7 } } }),
    prisma.trafficEvent.count({ where: { createdAt: { gte: day30 } } }),
    prisma.trafficEvent.count({ where: { createdAt: { gte: day7 }, eventType: "page_view" } }),
    prisma.trafficEvent.count({
      where: { createdAt: { gte: day7 }, eventType: { in: ["growth_cta", "growth_popup_open"] } },
    }),
    prisma.lead.count({ where: { createdAt: { gte: day7 } } }),
    prisma.lead.count({ where: { createdAt: { gte: day30 } } }),
    prisma.lead.count({
      where: { createdAt: { gte: day7 }, leadType: "mortgage" },
    }),
    prisma.platformPayment.aggregate({
      where: { createdAt: { gte: day30 }, status: "paid" },
      _sum: { amountCents: true },
    }),
    prisma.evaluateFunnelSession.count({ where: { submittedAt: null } }),
  ]);

  return NextResponse.json({
    window: { now: now.toISOString(), day7: day7.toISOString(), day30: day30.toISOString() },
    traffic: { events7d: traffic7d, events30d: traffic30d, pageViews7d, growthEngagement7d: growthCta7d },
    leads: { created7d: leads7d, created30d: leads30d, mortgage7d: mortgageLeads7d },
    revenue: {
      platformPayments30dCents: revenue30d._sum.amountCents ?? 0,
      note: "Supplement with GA4 for acquisition channels; this is server-recorded activity only.",
    },
    retargeting: { evaluateFunnelSessionsOpen: evalSessionsOpen },
  });
}
