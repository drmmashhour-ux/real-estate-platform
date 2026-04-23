import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const since = new Date(Date.now() - 90 * 86400000);

  const [byTool, byEvent, leadsBySource, cities] = await Promise.all([
    prisma.toolUsageEvent.groupBy({
      by: ["toolKey"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.toolUsageEvent.groupBy({
      by: ["toolKey", "eventType"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["leadSource"],
      where: {
        createdAt: { gte: since },
        leadSource: { in: ["investor_lead", "first_home_buyer_lead", "welcome_tax_lead"] },
      },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["purchaseRegion"],
      where: {
        createdAt: { gte: since },
        leadSource: "investor_lead",
        purchaseRegion: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { purchaseRegion: "desc" } },
      take: 12,
    }),
  ]);

  const toolUsageTotal = byTool.reduce((s, r) => s + r._count._all, 0);
  const leadTotal = leadsBySource.reduce((s, r) => s + r._count._all, 0);
  const bestConverting = leadsBySource.sort((a, b) => b._count._all - a._count._all)[0]?.leadSource ?? null;

  return NextResponse.json({
    periodDays: 90,
    toolUsageByKey: byTool,
    toolEventsDetailed: byEvent,
    leadsByToolSource: leadsBySource,
    topCitiesInvestorInterest: cities,
    totals: {
      toolEvents: toolUsageTotal,
      toolLeads: leadTotal,
      bestConvertingToolSource: bestConverting,
    },
    firstHomeBuyerLeads: leadsBySource.find((x) => x.leadSource === "first_home_buyer_lead")?._count._all ?? 0,
  });
}
