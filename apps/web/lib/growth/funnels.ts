import { prisma } from "@/lib/db";
import type { GrowthEventName } from "./types";
import { MANAGER_GROWTH_EVENT_NAMES } from "./types";

export type TimeWindow = "7d" | "30d" | "all";

function sinceForWindow(w: TimeWindow): Date | null {
  if (w === "all") return null;
  const days = w === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function countManagerGrowthEvent(
  name: GrowthEventName,
  window: TimeWindow,
): Promise<number> {
  const since = sinceForWindow(window);
  return prisma.growthFunnelEvent.count({
    where: {
      eventName: name,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
  });
}

/** Counts per event name for dashboards (real rows only). */
export async function getManagerGrowthEventCounts(
  window: TimeWindow,
): Promise<Record<GrowthEventName, number>> {
  const since = sinceForWindow(window);
  const rows = await prisma.growthFunnelEvent.groupBy({
    by: ["eventName"],
    where: {
      eventName: { in: [...MANAGER_GROWTH_EVENT_NAMES] },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _count: { _all: true },
  });
  const map = Object.fromEntries(
    MANAGER_GROWTH_EVENT_NAMES.map((n) => [n, 0]),
  ) as Record<GrowthEventName, number>;
  for (const r of rows) {
    if (MANAGER_GROWTH_EVENT_NAMES.includes(r.eventName as GrowthEventName)) {
      map[r.eventName as GrowthEventName] = r._count._all;
    }
  }
  return map;
}

type JsonProps = Record<string, unknown>;

function readLocale(props: unknown): string | null {
  if (!props || typeof props !== "object") return null;
  const l = (props as JsonProps).locale;
  return typeof l === "string" ? l : null;
}

function readMarket(props: unknown): string | null {
  if (!props || typeof props !== "object") return null;
  const m = (props as JsonProps).marketCode;
  return typeof m === "string" ? m : null;
}

/** Approximate locale / market splits from JSON properties (bounded sample for admin UI). */
export async function getManagerGrowthDimensionSplit(args: {
  window: TimeWindow;
  dimension: "locale" | "marketCode";
  sampleCap?: number;
}): Promise<{ key: string; count: number }[]> {
  const since = sinceForWindow(args.window);
  const cap = args.sampleCap ?? 8_000;
  const rows = await prisma.growthFunnelEvent.findMany({
    where: {
      eventName: { in: [...MANAGER_GROWTH_EVENT_NAMES] },
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    select: { properties: true },
    orderBy: { createdAt: "desc" },
    take: cap,
  });
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = args.dimension === "locale" ? readLocale(row.properties) : readMarket(row.properties);
    const k = raw && raw.length > 0 ? raw.slice(0, 32) : "(unset)";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export type FunnelRates = {
  listingViewToContactPct: number | null;
  listingViewToBookingRequestPct: number | null;
  bookingRequestToConfirmedPct: number | null;
  hostSignupToPublishedPct: number | null;
  syriaManualVsOnlineBookingCompleteRatio: number | null;
};

export function computeFunnelRates(counts: Record<GrowthEventName, number>, windowLabel: string): FunnelRates {
  void windowLabel;
  const lv = counts.listing_viewed || 0;
  const ch = counts.contact_host_clicked || 0;
  const brs = counts.booking_request_submitted || 0;
  const bc = counts.booking_confirmed || 0;
  const brStart = counts.booking_request_started || 0;
  const hsc = counts.host_signup_completed || 0;
  const lp = counts.listing_published || 0;
  const pay = counts.payment_completed || 0;
  const manualR = counts.manual_payment_marked_received || 0;

  return {
    listingViewToContactPct: lv > 0 ? (ch / lv) * 100 : null,
    listingViewToBookingRequestPct: lv > 0 ? (brs / lv) * 100 : null,
    bookingRequestToConfirmedPct: brStart > 0 ? (bc / brStart) * 100 : brs > 0 ? (bc / brs) * 100 : null,
    hostSignupToPublishedPct: hsc > 0 ? (lp / hsc) * 100 : null,
    syriaManualVsOnlineBookingCompleteRatio:
      pay + manualR > 0 ? manualR / (pay + manualR) : null,
  };
}
