import type { AnalyticsFunnelEventName } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BNHUB_JOURNEY_STEPS } from "./bnhub-journey-constants";

export type BnhubJourneySnapshot = {
  since: string;
  days: number;
  counts: Record<string, number>;
  /** Step-to-step rate (% of prior step volume). */
  rates: { from: AnalyticsFunnelEventName; to: AnalyticsFunnelEventName; pct: number | null }[];
  dropOffs: { step: string; lost: number; pctOfPrior: number | null }[];
  improvements: string[];
};

function pct(n: number, d: number): number | null {
  if (d <= 0) return null;
  return Math.round((n / d) * 1000) / 10;
}

function suggestImprovements(counts: Record<string, number>): string[] {
  const out: string[] = [];
  const get = (k: string) => counts[k] ?? 0;
  const landing = get("landing_visit");
  const search = get("search_used");
  const click = get("listing_click");
  const view = get("listing_view");
  const start = get("booking_started");
  const pay = get("payment_completed");

  if (landing > 50 && pct(search, landing) != null && (search / landing) * 100 < 12) {
    out.push("Search usage is low vs. landings: make the hero search more prominent and reduce friction to first query.");
  }
  if (search > 30 && pct(click, search) != null && (click / search) * 100 < 8) {
    out.push("Few listing clicks after search: improve card photos/titles, map/list balance, and result relevance.");
  }
  if (click > 20 && pct(view, click) != null && (view / click) * 100 < 70) {
    out.push("Listing page views lag behind result clicks: check load speed and broken routes.");
  }
  if (view > 20 && pct(start, view) != null && (start / view) * 100 < 5) {
    out.push("Checkout starts are low: clarify total price, fees, and trust (Stripe) above the fold.");
  }
  if (start > 10 && pct(pay, start) != null && (pay / start) * 100 < 40) {
    out.push("Payment completion drops after checkout start: review Stripe errors, deposit clarity, and mobile pay UX.");
  }
  if (out.length === 0) {
    out.push("Collect more journey events (landing, search, clicks, checkout) to surface targeted fixes.");
  }
  return out.slice(0, 8);
}

/**
 * Funnel counts for BNHub journey — uses `metadata.journey = 'bnhub'` where stored, else all events for journey-specific names.
 */
export async function getBnhubJourneySnapshot(days = 14): Promise<BnhubJourneySnapshot> {
  const since = new Date(Date.now() - days * 86400000);

  const rows = await prisma.analyticsFunnelEvent.findMany({
    where: {
      createdAt: { gte: since },
      name: { in: [...BNHUB_JOURNEY_STEPS] },
    },
    select: { name: true, metadata: true },
  });

  const counts: Record<string, number> = {};
  for (const s of BNHUB_JOURNEY_STEPS) counts[s] = 0;

  for (const r of rows) {
    const m = r.metadata as { journey?: string } | null;
    if (r.name === "listing_view" || r.name === "payment_completed") {
      if (m?.journey !== "bnhub") continue;
    }
    counts[r.name] = (counts[r.name] ?? 0) + 1;
  }

  const rates: BnhubJourneySnapshot["rates"] = [];
  for (let i = 0; i < BNHUB_JOURNEY_STEPS.length - 1; i++) {
    const from = BNHUB_JOURNEY_STEPS[i]!;
    const to = BNHUB_JOURNEY_STEPS[i + 1]!;
    rates.push({
      from,
      to,
      pct: pct(counts[to] ?? 0, counts[from] ?? 0),
    });
  }

  const dropOffs: BnhubJourneySnapshot["dropOffs"] = [];
  for (let i = 0; i < BNHUB_JOURNEY_STEPS.length - 1; i++) {
    const prior = BNHUB_JOURNEY_STEPS[i]!;
    const next = BNHUB_JOURNEY_STEPS[i + 1]!;
    const cPrior = counts[prior] ?? 0;
    const cNext = counts[next] ?? 0;
    const lost = Math.max(0, cPrior - cNext);
    dropOffs.push({
      step: `${prior} → ${next}`,
      lost,
      pctOfPrior: cPrior > 0 ? pct(lost, cPrior) : null,
    });
  }

  return {
    since: since.toISOString(),
    days,
    counts,
    rates,
    dropOffs,
    improvements: suggestImprovements(counts),
  };
}
