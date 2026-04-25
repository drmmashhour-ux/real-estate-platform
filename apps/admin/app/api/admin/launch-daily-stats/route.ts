import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const id = await getGuestId();
  if (!id) return { ok: false as const, status: 401, error: "Sign in required" };
  const u = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (u?.role !== "ADMIN") return { ok: false as const, status: 403, error: "Admin only" };
  return { ok: true as const };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const now = new Date();
  const todayStart = startOfDay(now);
  const day7 = new Date(todayStart.getTime() - 6 * 86400000);

  const [leadsToday, leadsLast7Days, wonLeads7d, mortgageClosed7d, timelineCallEvents7d] =
    await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.lead.findMany({
        where: { createdAt: { gte: day7 } },
        select: { createdAt: true },
      }),
      prisma.lead.count({
        where: {
          OR: [{ pipelineStatus: "won" }, { status: "won" }],
          dealClosedAt: { gte: day7 },
        },
      }),
      prisma.mortgageDeal.count({
        where: { createdAt: { gte: day7 }, status: { not: "void" } },
      }),
      prisma.leadTimelineEvent.count({
        where: {
          createdAt: { gte: day7 },
          eventType: { in: ["call_clicked", "whatsapp_clicked", "email_clicked"] },
        },
      }),
    ]);

  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const k = new Date(day7.getTime() + i * 86400000);
    const key = k.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  for (const row of leadsLast7Days) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (key in byDay) byDay[key] += 1;
  }

  return NextResponse.json({
    leadsToday,
    leadsPerDayLast7: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)),
    wonRealEstateLeads7d: wonLeads7d,
    mortgageDealsClosed7d: mortgageClosed7d,
    loggedCallOrMessageEvents7d: timelineCallEvents7d,
  });
}
