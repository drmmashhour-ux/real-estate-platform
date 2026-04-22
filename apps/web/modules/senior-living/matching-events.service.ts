/**
 * Senior matching funnel events — VIEW → CLICK → LEAD → VISIT → CONVERTED.
 * Used for performance scoring and explainable learning.
 */
import { prisma } from "@/lib/db";

export const MATCHING_EVENT_TYPES = ["VIEW", "CLICK", "LEAD", "VISIT", "CONVERTED"] as const;
export type MatchingEventType = (typeof MATCHING_EVENT_TYPES)[number];

/** Ignore duplicate VIEW spam within this window per user+residence (optional dedupe client-side). */
export const MIN_VIEWS_FOR_PERF = 8;

export async function recordMatchingEvent(input: {
  userId?: string | null;
  residenceId: string;
  eventType: MatchingEventType | string;
  scoreAtTime?: number | null;
}): Promise<void> {
  const eventType = String(input.eventType).toUpperCase().slice(0, 24);
  if (!["VIEW", "CLICK", "LEAD", "VISIT", "CONVERTED"].includes(eventType)) return;

  try {
    await prisma.matchingEvent.create({
      data: {
        userId: input.userId?.trim() || null,
        residenceId: input.residenceId.trim(),
        eventType,
        scoreAtTime: input.scoreAtTime != null ? Math.max(0, Math.min(100, input.scoreAtTime)) : null,
      },
    });
  } catch {
    /* residence may have been deleted; never surface to user */
  }
}

export type ResidenceFunnelCounts = {
  views: number;
  clicks: number;
  leads: number;
  visits: number;
  converted: number;
};

export function emptyFunnel(): ResidenceFunnelCounts {
  return { views: 0, clicks: 0, leads: 0, visits: 0, converted: 0 };
}

/** Row-level funnel for one residence (all time; learning can filter by date in SQL later). */
export async function getResidenceFunnelCounts(residenceId: string): Promise<ResidenceFunnelCounts> {
  const rows = await prisma.matchingEvent.groupBy({
    by: ["eventType"],
    where: { residenceId },
    _count: { _all: true },
  });
  const out = emptyFunnel();
  for (const r of rows) {
    const n = r._count._all;
    switch (r.eventType) {
      case "VIEW":
        out.views += n;
        break;
      case "CLICK":
        out.clicks += n;
        break;
      case "LEAD":
        out.leads += n;
        break;
      case "VISIT":
        out.visits += n;
        break;
      case "CONVERTED":
        out.converted += n;
        break;
      default:
        break;
    }
  }
  return out;
}

/**
 * CTR, lead rate, conversion rate with Laplace smoothing (stable for small n).
 */
export function computeFunnelRates(f: ResidenceFunnelCounts): { ctr: number; leadRate: number; conversionRate: number } {
  const views = f.views + 1;
  const clicks = f.clicks + 1;
  const ctr = Math.min(1, clicks / views);
  const leadRate = Math.min(1, (f.leads + 0.5) / clicks);
  const conversionRate = Math.min(1, (f.converted + 0.5) / (f.leads + 1));
  return { ctr, leadRate, conversionRate };
}

/** 0–100: normalized blend of CTR, lead capture, and lead-to-outcome conversion. */
export function funnelToPerformanceScore(f: ResidenceFunnelCounts): number {
  const { ctr, leadRate, conversionRate } = computeFunnelRates(f);
  const raw = ((ctr + leadRate + conversionRate) / 3) * 100;
  if (f.views < MIN_VIEWS_FOR_PERF) {
    /** Neutral blend until enough impressions — avoids noisy early rankings. */
    return Math.round((raw + 50) / 2);
  }
  return Math.round(Math.max(0, Math.min(100, raw)));
}

/** CTR, lead rate, conversion rate + raw counts for dashboards (Part 3 metrics). */
export async function getResidencePerformanceMetrics(residenceId: string) {
  const f = await getResidenceFunnelCounts(residenceId);
  const { ctr, leadRate, conversionRate } = computeFunnelRates(f);
  return {
    ...f,
    ctr,
    leadRate,
    conversionRate,
    ctrPercent: Math.round(ctr * 1000) / 10,
    leadRatePercent: Math.round(leadRate * 1000) / 10,
    conversionRatePercent: Math.round(conversionRate * 1000) / 10,
  };
}

export async function getPerformanceScoresForResidences(ids: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;

  const rows = await prisma.matchingEvent.groupBy({
    by: ["residenceId", "eventType"],
    where: { residenceId: { in: ids } },
    _count: { _all: true },
  });

  const funnelByResidence = new Map<string, ResidenceFunnelCounts>();
  for (const id of ids) funnelByResidence.set(id, emptyFunnel());
  for (const r of rows) {
    const cur = funnelByResidence.get(r.residenceId) ?? emptyFunnel();
    const n = r._count._all;
    switch (r.eventType) {
      case "VIEW":
        cur.views += n;
        break;
      case "CLICK":
        cur.clicks += n;
        break;
      case "LEAD":
        cur.leads += n;
        break;
      case "VISIT":
        cur.visits += n;
        break;
      case "CONVERTED":
        cur.converted += n;
        break;
      default:
        break;
    }
    funnelByResidence.set(r.residenceId, cur);
  }

  for (const id of ids) {
    map.set(id, funnelToPerformanceScore(funnelByResidence.get(id) ?? emptyFunnel()));
  }
  return map;
}
