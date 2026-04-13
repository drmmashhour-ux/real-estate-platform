import { prisma } from "@/lib/db";
import type { RecommendationWidgetSource } from "./recommendation-events";

export type RecommendationAdminStats = {
  periodDays: number;
  bySource: Record<
    RecommendationWidgetSource | "unknown",
    { impressions: number; clicks: number; ctr: number }
  >;
  topListingIds: Array<{ listingId: string; impressions: number; clicks: number }>;
  lowCtrWidgets: Array<{ widget: string; impressions: number; clicks: number; ctr: number }>;
};

function asRecoMeta(m: unknown): { source?: string; widget?: string } | null {
  if (!m || typeof m !== "object") return null;
  const o = m as Record<string, unknown>;
  if (o.reco !== true) return null;
  return {
    source: typeof o.recoSource === "string" ? o.recoSource : undefined,
    widget: typeof o.recoWidget === "string" ? o.recoWidget : undefined,
  };
}

export async function getRecommendationAdminStats(periodDays = 7): Promise<RecommendationAdminStats> {
  const since = new Date(Date.now() - periodDays * 86400000);
  const rows = await prisma.searchEvent.findMany({
    where: { createdAt: { gte: since }, listingId: { not: null } },
    select: { eventType: true, listingId: true, metadata: true },
    take: 25000,
  });

  const bySource: RecommendationAdminStats["bySource"] = {
    similar: { impressions: 0, clicks: 0, ctr: 0 },
    personalized: { impressions: 0, clicks: 0, ctr: 0 },
    trending: { impressions: 0, clicks: 0, ctr: 0 },
    recent: { impressions: 0, clicks: 0, ctr: 0 },
    saved: { impressions: 0, clicks: 0, ctr: 0 },
    unknown: { impressions: 0, clicks: 0, ctr: 0 },
  };

  const listingAgg = new Map<string, { imp: number; clk: number }>();
  const widgetAgg = new Map<string, { imp: number; clk: number }>();

  for (const r of rows) {
    const meta = asRecoMeta(r.metadata);
    if (!meta) continue;
    const src = (meta.source as RecommendationWidgetSource) ?? "unknown";
    const bucket = bySource[src] ?? bySource.unknown;
    const isClick = r.eventType === "CLICK";
    const isView = r.eventType === "VIEW";
    if (isView) {
      bucket.impressions++;
      if (r.listingId) {
        const cur = listingAgg.get(r.listingId) ?? { imp: 0, clk: 0 };
        cur.imp++;
        listingAgg.set(r.listingId, cur);
      }
      if (meta.widget) {
        const w = widgetAgg.get(meta.widget) ?? { imp: 0, clk: 0 };
        w.imp++;
        widgetAgg.set(meta.widget, w);
      }
    }
    if (isClick) {
      bucket.clicks++;
      if (r.listingId) {
        const cur = listingAgg.get(r.listingId) ?? { imp: 0, clk: 0 };
        cur.clk++;
        listingAgg.set(r.listingId, cur);
      }
      if (meta.widget) {
        const w = widgetAgg.get(meta.widget) ?? { imp: 0, clk: 0 };
        w.clk++;
        widgetAgg.set(meta.widget, w);
      }
    }
  }

  for (const k of Object.keys(bySource) as (keyof typeof bySource)[]) {
    const b = bySource[k];
    b.ctr = b.impressions > 0 ? b.clicks / b.impressions : 0;
  }

  const topListingIds = [...listingAgg.entries()]
    .map(([listingId, v]) => ({ listingId, impressions: v.imp, clicks: v.clk }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  const lowCtrWidgets = [...widgetAgg.entries()]
    .map(([widget, v]) => ({
      widget,
      impressions: v.imp,
      clicks: v.clk,
      ctr: v.imp > 0 ? v.clk / v.imp : 0,
    }))
    .filter((w) => w.impressions >= 8)
    .sort((a, b) => a.ctr - b.ctr)
    .slice(0, 12);

  return { periodDays, bySource, topListingIds, lowCtrWidgets };
}
