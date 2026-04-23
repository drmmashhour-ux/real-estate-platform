import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import type { ContentItem, ContentPerformance } from "./content-calendar.types";
import { getContentItem, listContentItems, updateContentItem } from "./content-calendar.service";

export type MarketingContentDashboardSummary = {
  postsToday: number;
  postsThisWeek: number;
  leadsFromContent: number;
  revenueFromContentCents: number;
  bestPerforming: ContentItem | null;
};

function engagementScore(p: ContentPerformance): number {
  const e = p.engagementScore;
  if (e != null && e > 0) return e;
  return p.views + p.clicks * 2 + p.leads * 50 + Math.floor(p.revenueCents / 100);
}

export function updatePerformance(
  contentId: string,
  patch: Partial<ContentPerformance>
): ContentItem | null {
  const cur = getContentItem(contentId);
  if (!cur) return null;
  return updateContentItem(contentId, { performance: patch });
}

function dayFromPosted(postedIso: string | undefined): string | null {
  if (!postedIso) return null;
  try {
    return format(parseISO(postedIso), "yyyy-MM-dd");
  } catch {
    return null;
  }
}

export function buildMarketingContentDashboardSummaryFromItems(
  items: ContentItem[],
  now = new Date()
): MarketingContentDashboardSummary {
  const todayIso = format(now, "yyyy-MM-dd");
  const ws = startOfWeek(now, { weekStartsOn: 1 });
  const we = endOfWeek(now, { weekStartsOn: 1 });

  let postsToday = 0;
  let postsThisWeek = 0;
  let leadsFromContent = 0;
  let revenueFromContentCents = 0;

  let best: ContentItem | null = null;
  let bestScore = -1;

  for (const it of items) {
    leadsFromContent += it.performance.leads ?? 0;
    revenueFromContentCents += it.performance.revenueCents ?? 0;

    const postedDay = dayFromPosted(it.postedDate);
    const touchesToday =
      it.scheduledDate === todayIso || postedDay === todayIso;
    if (touchesToday) postsToday += 1;

    if (it.scheduledDate) {
      try {
        const d = parseISO(it.scheduledDate);
        if (isWithinInterval(d, { start: ws, end: we })) postsThisWeek += 1;
      } catch {
        /* noop */
      }
    }

    const sc = engagementScore(it.performance);
    if (it.status === "POSTED" && sc > bestScore) {
      bestScore = sc;
      best = it;
    }
  }

  return {
    postsToday,
    postsThisWeek,
    leadsFromContent,
    revenueFromContentCents,
    bestPerforming: best,
  };
}

export function buildMarketingContentDashboardSummary(now = new Date()): MarketingContentDashboardSummary {
  return buildMarketingContentDashboardSummaryFromItems(listContentItems(), now);
}

export function rankByPerformance(items: ContentItem[]): ContentItem[] {
  return [...items].sort(
    (a, b) => engagementScore(b.performance) - engagementScore(a.performance)
  );
}
