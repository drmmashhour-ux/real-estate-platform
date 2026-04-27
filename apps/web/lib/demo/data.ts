import { eachYmdInclusive } from "@/lib/booking/dailyCalendarQuery";
import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";
import type { ListingDailyCalendarDay } from "@/lib/booking/dailyCalendarQuery";
import { platformFeeCentsFromSubtotal } from "@/lib/pricing/calculateTotal";
import type { CityPricingRecommendation } from "@/lib/market/cityPricingEngine";
import type { DemoScenarioId } from "@/lib/demo/mode";

/** Public listing row — matches `GET /api/listings` projection. */
export type DemoListingRow = {
  id: string;
  title: string;
  price: number;
  city: string;
  country: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  bookings: number;
};

const ISO = "2026-01-15T12:00:00.000Z";

const BASE_LISTINGS: Omit<DemoListingRow, "bookings" | "createdAt" | "updatedAt">[] = [
  { id: "demo-1", title: "Luxury Condo Downtown Montreal", city: "Montreal", country: "CA", price: 145, userId: "demo-host" },
  { id: "demo-2", title: "Plateau Loft with City Views", city: "Montreal", country: "CA", price: 128, userId: "demo-host" },
  { id: "demo-3", title: "Waterfront Townhouse Laval", city: "Laval", country: "CA", price: 189, userId: "demo-host" },
  { id: "demo-4", title: "Quartier des spectacles Studio", city: "Montreal", country: "CA", price: 98, userId: "demo-host" },
  { id: "demo-5", title: "Griffintown 2BR — High floor", city: "Montreal", country: "CA", price: 210, userId: "demo-host" },
  { id: "demo-6", title: "Longueuil Garden Suite", city: "Longueuil", country: "CA", price: 112, userId: "demo-host" },
  { id: "demo-7", title: "West Island Family Home", city: "Kirkland", country: "CA", price: 175, userId: "demo-host" },
  { id: "demo-8", title: "Old Montreal Heritage Flat", city: "Montreal", country: "CA", price: 165, userId: "demo-host" },
];

function applyScenarioToListings(scenario: DemoScenarioId): DemoListingRow[] {
  const mult =
    scenario === "high_demand" ? 1.12 : scenario === "low_conversion" ? 0.92 : scenario === "growth_surge" ? 1.08 : 1;
  return BASE_LISTINGS.map((l, i) => ({
    ...l,
    price: Math.round(l.price * mult + (scenario === "growth_surge" ? i * 2 : 0)),
    createdAt: ISO,
    updatedAt: ISO,
    bookings: scenario === "high_demand" ? 3 + i : scenario === "low_conversion" ? 0 : 1 + (i % 2),
  }));
}

export function getDemoListings(scenario: DemoScenarioId = "default"): DemoListingRow[] {
  const s = scenario === "default" ? "default" : scenario;
  return applyScenarioToListings(s);
}

export function getDemoListingById(
  id: string,
  scenario: DemoScenarioId
): (Record<string, unknown> & { id: string; title: string; price: number; city: string; country: string }) | null {
  const row = getDemoListings(scenario).find((l) => l.id === id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    city: row.city,
    country: row.country,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    bookings: row.bookings,
    host: null,
    dealHighlightScore: scenario === "growth_surge" ? 72 : 58,
    description: "Demonstration listing — not a real property. Data is simulated for product tours.",
    marketPrice: row.price * 0.98,
  };
}

export type DemoBookingRow = {
  id: string;
  listingId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

export function getDemoBookings(scenario: DemoScenarioId): DemoBookingRow[] {
  return [
    {
      id: "demo-bk-1",
      listingId: "demo-1",
      userId: "demo-guest",
      startDate: "2026-02-10",
      endDate: "2026-02-14",
      status: "pending",
      expiresAt: null,
      createdAt: ISO,
    },
    {
      id: "demo-bk-2",
      listingId: "demo-2",
      userId: "demo-guest",
      startDate: "2026-03-01",
      endDate: "2026-03-05",
      status: "confirmed",
      expiresAt: null,
      createdAt: ISO,
    },
  ].slice(0, scenario === "low_conversion" ? 0 : 2);
}

function demandFor(scenario: DemoScenarioId, i: number): ListingDailyCalendarDay["demandLevel"] {
  if (scenario === "high_demand") return "high";
  if (scenario === "low_conversion") return i % 5 === 0 ? "medium" : "low";
  if (scenario === "growth_surge") return i % 3 === 0 ? "high" : "medium";
  return i % 7 === 0 ? "high" : i % 3 === 0 ? "medium" : "low";
}

/**
 * Batched calendar days with mixed blocked / high-demand (Order 61).
 */
export function getDemoCalendar(
  listingId: string,
  startYmd: string,
  endYmd: string,
  scenario: DemoScenarioId
): ListingDailyCalendarDay[] {
  const list = getDemoListings(scenario);
  const row = list.find((l) => l.id === listingId);
  const base = row?.price ?? 120;
  const keys = eachYmdInclusive(startYmd, endYmd);
  return keys.map((date, i) => {
    const weekend = new Date(date + "T12:00:00Z").getUTCDay();
    const isWeekend = weekend === 0 || weekend === 6;
    const mult = (isWeekend ? 1.08 : 1) * (scenario === "high_demand" ? 1.15 : 1);
    const suggested = Math.round(base * mult + (i % 4) * 3);
    const demandLevel = demandFor(scenario, i);
    const blocked =
      (scenario === "high_demand" && i % 11 === 4) || (scenario === "default" && i % 14 === 5);
    return {
      date,
      available: !blocked,
      booked: blocked,
      basePrice: base,
      suggestedPrice: blocked ? null : suggested,
      adjustmentPercent: 5,
      demandLevel: blocked ? "low" : demandLevel,
      reason: blocked ? "demo: booked" : "demo: seasonality + heatmap",
    };
  });
}

export function getDemoCityPricing(scenario: DemoScenarioId): CityPricingRecommendation[] {
  const high = scenario === "high_demand" || scenario === "growth_surge";
  return [
    {
      city: "Montreal",
      demandScore: high ? 118 : 62,
      views: 12400,
      bookings: high ? 42 : 8,
      trend: high ? 0.22 : 0.05,
      demandBand: high ? "HIGH" : "MEDIUM",
      demandActions: high ? ["increase_prices", "add_supply"] : [],
      recommendation: high ? "increase_price" : "keep_price",
      suggestedAdjustmentPercent: high ? 6 : 0,
      reason: "Demo: composite demand from simulated heatmap.",
    },
    {
      city: "Laval",
      demandScore: scenario === "low_conversion" ? 45 : 88,
      views: 3100,
      bookings: 5,
      trend: -0.05,
      demandBand: scenario === "low_conversion" ? "MEDIUM" : "HIGH",
      demandActions: [],
      recommendation: scenario === "low_conversion" ? "decrease_price" : "increase_price",
      suggestedAdjustmentPercent: scenario === "low_conversion" ? -4 : 3,
      reason: "Demo scenario variance — not live market data.",
    },
    {
      city: "Longueuil",
      demandScore: 70,
      views: 2100,
      bookings: 4,
      trend: 0,
      demandBand: "MEDIUM",
      demandActions: [],
      recommendation: "keep_price",
      suggestedAdjustmentPercent: 0,
      reason: "Simulated for investor UI.",
    },
  ];
}

/** Matches `getCampaignPerformance` list shape loosely for dashboards. */
export function getDemoCampaignPerformanceList(scenario: DemoScenarioId) {
  const mult = scenario === "growth_surge" ? 1.4 : scenario === "low_conversion" ? 0.4 : 1;
  return {
    mode: "campaigns" as const,
    demo: true,
    total: 2,
    limit: 20,
    offset: 0,
    items: [
      {
        id: "demo-cmp-1",
        name: "Q1 retargeting — Montreal",
        platform: "meta",
        status: "active",
        impressions: Math.round(120_000 * mult),
        clicks: Math.round(3200 * mult),
        conversions: Math.round(48 * mult),
        recommendation: "Shift 15% budget to Laval lookalike (demo).",
        spendCents: Math.round(450_00 * mult),
        simulated: true,
      },
      {
        id: "demo-cmp-2",
        name: "Search — high intent",
        platform: "google",
        status: "paused",
        impressions: Math.round(45_000 * mult),
        clicks: Math.round(900 * mult),
        conversions: Math.round(12 * mult),
        recommendation: "Resume with tighter geo when ready (demo).",
        spendCents: Math.round(180_00 * mult),
        simulated: true,
      },
    ],
  };
}

/**
 * `getDemoPricing` — single export for “pricing snapshot” consumers (Order 61).
 */
export function getDemoPricing(scenario: DemoScenarioId) {
  return {
    scenario,
    source: "demo" as const,
    listingsSample: getDemoListings(scenario).slice(0, 3).map((l) => ({ id: l.id, price: l.price, city: l.city })),
    serviceFeeRate: 0.1,
    cityPricing: getDemoCityPricing(scenario),
  };
}

export type DemoPriceBreakdown = {
  nights: number;
  nightly: number[];
  baseSubtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: string;
  allNightsAvailable: boolean;
};

export function getDemoBookingPriceBreakdown(
  listingId: string,
  startYmd: string,
  endYmd: string,
  scenario: DemoScenarioId
): DemoPriceBreakdown | null {
  const list = getDemoListings(scenario);
  const row = list.find((l) => l.id === listingId);
  if (!row) return null;
  const keys = nightYmdKeysForStay(startYmd, endYmd);
  if (keys.length === 0) return null;
  const cal = getDemoCalendar(listingId, startYmd, endYmd, scenario);
  const by = new Map(cal.map((d) => [d.date, d]));
  const nightly: number[] = [];
  let blocked = false;
  for (const ymd of keys) {
    const d = by.get(ymd);
    const p = d?.suggestedPrice ?? d?.basePrice ?? row.price;
    const n = typeof p === "number" && Number.isFinite(p) ? p : row.price;
    nightly.push(Math.round(n * 100) / 100);
    if (d?.booked) blocked = true;
  }
  const baseSubtotal = Math.round(nightly.reduce((a, b) => a + b, 0) * 100) / 100;
  const cleaningFee = 0;
  const cents = Math.round(baseSubtotal * 100);
  const serviceFee = platformFeeCentsFromSubtotal(cents) / 100;
  const taxes = 0;
  const total = Math.round((baseSubtotal + cleaningFee + serviceFee + taxes) * 100) / 100;
  return {
    nights: keys.length,
    nightly,
    baseSubtotal,
    cleaningFee,
    serviceFee,
    taxes,
    total,
    currency: "USD",
    allNightsAvailable: !blocked,
  };
}

export function getDemoMarketAiSummary() {
  return {
    hotZones: [
      { name: "Plateau", score: 88, reason: "Demo: elevated saved searches." },
      { name: "Griffintown", score: 82, reason: "Demo: new listing velocity." },
    ],
    trendingAreas: [
      { city: "Montreal", changePct: 4.2 },
      { city: "Laval", changePct: 2.1 },
    ],
    disclaimer: "Demonstration data — not a live forecast.",
    demo: true,
  };
}
