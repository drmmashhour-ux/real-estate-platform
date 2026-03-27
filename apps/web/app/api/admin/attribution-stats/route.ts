import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewerId = await getGuestId();
  if (!viewerId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const [totals, wonRows, campaignRows, eventCounts] = await Promise.all([
    prisma.lead.groupBy({
      by: ["source"],
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: {
        OR: [{ pipelineStatus: "won" }, { dealClosedAt: { not: null } }],
      },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["campaign"],
      where: { campaign: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { campaign: "desc" } },
      take: 25,
    }),
    prisma.trafficEvent.groupBy({
      by: ["eventType"],
      _count: { _all: true },
    }),
  ]);

  const wonBySource = new Map<string | null, number>();
  for (const row of wonRows) {
    wonBySource.set(row.source, row._count._all);
  }

  const leadsBySource = totals.map((row) => {
    const total = row._count._all;
    const won = wonBySource.get(row.source) ?? 0;
    const ratePct = total > 0 ? Math.round((won / total) * 1000) / 10 : 0;
    const label = row.source ?? "(not tracked — before attribution)";
    return {
      source: label,
      leads: total,
      won,
      conversionRatePct: ratePct,
    };
  });

  leadsBySource.sort((a, b) => b.leads - a.leads);

  const topCampaigns = campaignRows
    .filter((r) => r.campaign)
    .map((r) => ({
      campaign: r.campaign as string,
      leads: r._count._all,
    }));

  const eventsByType = Object.fromEntries(
    eventCounts.map((e) => [e.eventType, e._count._all])
  );

  return NextResponse.json({
    leadsBySource,
    topCampaigns,
    eventsByType,
  });
}
