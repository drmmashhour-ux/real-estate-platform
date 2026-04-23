import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getGuestId } from "@/lib/auth/session";
import { ORGANIC_LABELS, normalizeOrganicSource, type OrganicLabel } from "@/lib/organic/normalize-source";

export const dynamic = "force-dynamic";

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function isWon(row: { pipelineStatus: string; dealClosedAt: Date | null }): boolean {
  return row.pipelineStatus === "won" || row.dealClosedAt != null;
}

export async function GET(req: NextRequest) {
  const viewerId = await getGuestId();
  if (!viewerId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { role: true },
  });
  if (viewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const days = Math.min(366, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10) || 30));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [leads, events] = await Promise.all([
    prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        source: true,
        campaign: true,
        createdAt: true,
        pipelineStatus: true,
        dealClosedAt: true,
        highIntent: true,
      },
    }),
    prisma.trafficEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { eventType: true, source: true, createdAt: true },
    }),
  ]);

  const dailyAll = new Map<string, number>();
  const dailyOrganic = new Map<string, number>();
  for (const l of leads) {
    const d = l.createdAt.toISOString().slice(0, 10);
    dailyAll.set(d, (dailyAll.get(d) ?? 0) + 1);
    const bucket = normalizeOrganicSource(l.source);
    if (bucket !== "Other") {
      dailyOrganic.set(d, (dailyOrganic.get(d) ?? 0) + 1);
    }
  }

  const dailySeries = [...dailyAll.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, leadsCount]) => ({ date, leadsCount }));

  const last7 = dailySeries.slice(-7).reduce((s, x) => s + x.leadsCount, 0);
  const prev7 = dailySeries.slice(-14, -7).reduce((s, x) => s + x.leadsCount, 0);
  let dailyTrend: "up" | "down" | "flat" = "flat";
  if (last7 > prev7) dailyTrend = "up";
  else if (last7 < prev7) dailyTrend = "down";

  const byLabel: Record<OrganicLabel, { leads: number; won: number }> = {
    Facebook: { leads: 0, won: 0 },
    Instagram: { leads: 0, won: 0 },
    WhatsApp: { leads: 0, won: 0 },
    Direct: { leads: 0, won: 0 },
    Other: { leads: 0, won: 0 },
  };

  for (const l of leads) {
    const label = normalizeOrganicSource(l.source);
    byLabel[label].leads += 1;
    if (isWon(l)) byLabel[label].won += 1;
  }

  const coreOrganicLeads = ORGANIC_LABELS.reduce((s, k) => s + byLabel[k].leads, 0);
  const leadsBySource = ORGANIC_LABELS.map((name) => ({
    source: name,
    leads: byLabel[name].leads,
    won: byLabel[name].won,
    conversionRatePct: pct(byLabel[name].won, byLabel[name].leads),
  }));

  let topOrganicSource: (typeof ORGANIC_LABELS)[number] | null = null;
  let maxLeads = -1;
  for (const name of ORGANIC_LABELS) {
    if (byLabel[name].leads > maxLeads) {
      maxLeads = byLabel[name].leads;
      topOrganicSource = name;
    }
  }
  if (maxLeads <= 0) topOrganicSource = null;

  let bestConverting: { source: string; conversionRatePct: number } | null = null;
  const eligible = ORGANIC_LABELS.filter((name) => byLabel[name].leads >= 2);
  if (eligible.length > 0) {
    const pick = eligible.reduce((a, b) =>
      pct(byLabel[b].won, byLabel[b].leads) > pct(byLabel[a].won, byLabel[a].leads) ? b : a
    );
    bestConverting = {
      source: pick,
      conversionRatePct: pct(byLabel[pick].won, byLabel[pick].leads),
    };
  }

  const insights: string[] = [];
  if (topOrganicSource && maxLeads > 0) {
    insights.push(`Most leads come from ${topOrganicSource} (${maxLeads} in period).`);
  } else {
    insights.push("No organic-tagged leads in this period — use ?source= on share links.");
  }
  if (bestConverting && bestConverting.conversionRatePct > 0) {
    insights.push(
      `${bestConverting.source} leads show the strongest win rate (${bestConverting.conversionRatePct}%).`
    );
  } else if (eligible.length > 0) {
    insights.push("Win rates are even across channels — keep tagging sources for clearer insight.");
  }

  const engagementByType: Record<string, number> = {};
  const engagementBySource: Record<string, number> = {};
  for (const e of events) {
    const et = e.eventType === "evaluation_submit" ? "evaluation_submitted" : e.eventType;
    engagementByType[et] = (engagementByType[et] ?? 0) + 1;
    const src = normalizeOrganicSource(e.source);
    const key = src === "Other" ? "Other" : src;
    engagementBySource[key] = (engagementBySource[key] ?? 0) + 1;
  }

  const highIntentLeads = leads.filter((l) => l.highIntent).length;

  return NextResponse.json({
    periodDays: days,
    since: since.toISOString(),
    totalOrganicLeads: coreOrganicLeads,
    otherSourceLeads: byLabel.Other.leads,
    totalLeadsInPeriod: leads.length,
    highIntentLeads,
    leadsBySource,
    topOrganicSource,
    bestConvertingSource: bestConverting,
    dailyLeadFlow: dailySeries,
    dailyTrend,
    last7DaysLeads: last7,
    previous7DaysLeads: prev7,
    engagement: {
      eventsByType: engagementByType,
      eventsByAttributedSource: engagementBySource,
    },
    insights,
  });
}
