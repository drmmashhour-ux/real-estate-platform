import { prisma } from "@/lib/db";

const IMPRESSION_EVENTS = new Set(["landing_view", "page_view"]);
const CLICK_EVENTS = new Set(["cta_click"]);
const LEAD_EVENTS = new Set(["lead_capture", "broker_lead"]);
const BOOKING_DONE = new Set(["booking_completed"]);

export type VariantResultRow = {
  variantId: string;
  variantKey: string;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  revenue: number;
  ctr: number | null;
  cvr: number | null;
  leadRate: number | null;
  bookingRate: number | null;
  revenuePerVisitor: number | null;
  revenuePerLead: number | null;
};

/**
 * Aggregates `experiment_events` per variant — descriptive rates, not p-values.
 */
export async function computeExperimentResults(experimentId: string): Promise<{
  perVariant: VariantResultRow[];
  totals: { impressions: number; clicks: number };
}> {
  const variants = await prisma.experimentVariant.findMany({
    where: { experimentId },
    orderBy: { variantKey: "asc" },
  });

  const grouped = await prisma.experimentEvent.groupBy({
    by: ["variantId", "eventName"],
    where: { experimentId },
    _count: { _all: true },
  });

  const counts = new Map<string, Map<string, number>>();
  for (const g of grouped) {
    if (!counts.has(g.variantId)) counts.set(g.variantId, new Map());
    counts.get(g.variantId)!.set(g.eventName, g._count._all);
  }

  const perVariant: VariantResultRow[] = [];

  let ti = 0;
  let tc = 0;

  for (const v of variants) {
    const m = counts.get(v.id) ?? new Map();
    let impressions = 0;
    let clicks = 0;
    let leads = 0;
    let bookings = 0;
    for (const [name, c] of m) {
      if (IMPRESSION_EVENTS.has(name)) impressions += c;
      if (CLICK_EVENTS.has(name)) clicks += c;
      if (LEAD_EVENTS.has(name)) leads += c;
      if (BOOKING_DONE.has(name)) bookings += c;
    }
    ti += impressions;
    tc += clicks;

    const ctr = impressions > 0 ? clicks / impressions : null;
    const cvr = clicks > 0 ? bookings / clicks : null;
    const leadRate = clicks > 0 ? leads / clicks : null;
    const bookingRate = leads > 0 ? bookings / leads : null;

    perVariant.push({
      variantId: v.id,
      variantKey: v.variantKey,
      impressions,
      clicks,
      leads,
      bookings,
      revenue: 0,
      ctr: ctr != null ? Math.round(ctr * 10000) / 10000 : null,
      cvr: cvr != null ? Math.round(cvr * 10000) / 10000 : null,
      leadRate: leadRate != null ? Math.round(leadRate * 10000) / 10000 : null,
      bookingRate: bookingRate != null ? Math.round(bookingRate * 10000) / 10000 : null,
      revenuePerVisitor: null,
      revenuePerLead: null,
    });
  }

  return { perVariant, totals: { impressions: ti, clicks: tc } };
}
