import { prisma } from "@/lib/db";
import { computeAcquisitionMetrics } from "@/modules/acquisition/acquisition-tracking.service";
import { buildInvestorMetricTable } from "@/modules/investor-metrics/investor-metrics.service";
import { buildRevenueMetricsSnapshot } from "@/modules/investor-metrics/revenue-metrics.service";
import { getRecentMetricSnapshots } from "@/src/modules/investor-metrics/metricsSnapshot";

import type { GrowthPointVm, HubRevenueKey, InvestorPitchDashboardVm } from "./investor-pitch.types";
import { buildTenSlidePitchDeck } from "./investor-pitch-slides.service";
import { buildNarrativeBlocks } from "./investor-story.service";

function classifyHub(eventType: string): HubRevenueKey {
  const t = eventType.toLowerCase();
  if (t.includes("bnhub") || t.includes("stay") || t.includes("booking_fee") || t.includes("host_payout")) return "BNHub";
  if (t.includes("broker") || t.includes("crm") || t.includes("commission_broker")) return "Broker";
  if (t.includes("fsbo") || t.includes("listing") || t.includes("seller") || t.includes("marketplace")) return "Listings";
  if (t.includes("senior") || t.includes("soins") || t.includes("residence")) return "Residence";
  if (t.includes("amf") || t.includes("capital") || t.includes("investor_deal") || t.includes("placement")) return "Investor";
  return "Other";
}

async function revenueByHub90d(): Promise<Record<HubRevenueKey, number>> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 90);

  const events = await prisma.revenueEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { eventType: true, amount: true },
  });

  const out: Record<HubRevenueKey, number> = {
    BNHub: 0,
    Broker: 0,
    Listings: 0,
    Residence: 0,
    Investor: 0,
    Other: 0,
  };

  for (const e of events) {
    const hub = classifyHub(e.eventType);
    out[hub] += e.amount ?? 0;
  }

  return out;
}

function snapshotsToGrowthPoints(rows: Awaited<ReturnType<typeof getRecentMetricSnapshots>>): GrowthPointVm[] {
  return [...rows]
    .reverse()
    .slice(-90)
    .map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      totalUsers: r.totalUsers,
      totalListings: r.totalListings,
      bookings: r.bookings,
      revenue: r.revenue,
    }));
}

export function aggregateWeekly(daily: GrowthPointVm[]): GrowthPointVm[] {
  const buckets = new Map<string, GrowthPointVm>();
  for (const d of daily) {
    const dt = new Date(d.date + "T12:00:00Z");
    const monday = new Date(dt);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    const prev = buckets.get(key);
    if (!prev) {
      buckets.set(key, { ...d, date: key });
    } else {
      buckets.set(key, {
        date: key,
        totalUsers: Math.max(prev.totalUsers, d.totalUsers),
        totalListings: Math.max(prev.totalListings, d.totalListings),
        bookings: prev.bookings + d.bookings,
        revenue: prev.revenue + d.revenue,
      });
    }
  }
  return [...buckets.values()].slice(-26);
}

const SAMPLE_GROWTH_DAILY: GrowthPointVm[] = Array.from({ length: 28 }, (_, i) => ({
  date: new Date(Date.now() - (27 - i) * 86400000).toISOString().slice(0, 10),
  totalUsers: 9000 + i * 120,
  totalListings: 700 + i * 8,
  bookings: 800 + i * 15,
  revenue: 120000 + i * 9000,
}));

export const INVESTOR_PITCH_SAMPLE: InvestorPitchDashboardVm = {
  generatedAt: new Date().toISOString(),
  sampleMode: true,
  overview: {
    multiHub: ["BNHub stays", "Broker CRM & deals", "Seller / listings", "Residence / soins", "Investor capital"],
    aiLayer: ["Review-first assistance", "Lead routing signals", "Compliance-aware drafts"],
    growthEngine: ["Acquisition CRM", "Marketing Hub reels", "City intent landing"],
  },
  marketPosition: [
    "Real estate operating system spanning resale, short-term, and regulated niches.",
    "Marketplace liquidity + broker-grade workflows + AI augmentation — not a single-vertical OTA.",
  ],
  liveMetrics: {
    totalUsers: 12840,
    totalListings: 942,
    bookings30d: 1380,
    leads30dApprox: 420,
    revenue30dApprox: 485000,
  },
  revenueByHub: {
    BNHub: 210000,
    Broker: 95000,
    Listings: 78000,
    Residence: 42000,
    Investor: 60000,
    Other: 12000,
  },
  revenueByHubDisclaimer:
    "Sample illustrative split — live view allocates RevenueEvent.amount by event_type heuristics.",
  growthDaily: SAMPLE_GROWTH_DAILY,
  growthWeekly: aggregateWeekly(SAMPLE_GROWTH_DAILY),
  aiHighlights: [
    "Risk-ranked lead inbox reduces broker noise while preserving audit trails.",
    "Growth signals tie marketing drafts to funnel metrics — human approval required.",
  ],
  growthActions: [
    "Acquisition pipeline stages from NEW → CONVERTED with invite redemption on signup.",
    "Metric snapshots capture daily users, listings, bookings, revenue for investor charts.",
  ],
  narrativeBlocks: buildNarrativeBlocks({ sampleMode: true }),
  acquisitionSnapshot: {
    totalContacts: 124,
    conversionRateByType: { BROKER: 0.22, HOST: 0.31, USER: 0.18, RESIDENCE: 0.12 },
  },
  slides: buildTenSlidePitchDeck({ sampleMode: true }),
};

export async function buildLiveInvestorPitchDashboard(): Promise<InvestorPitchDashboardVm> {
  const [table, revenueSnap, snapshots, hubRev, acquisition] = await Promise.all([
    buildInvestorMetricTable(),
    buildRevenueMetricsSnapshot(),
    getRecentMetricSnapshots(120),
    revenueByHub90d(),
    computeAcquisitionMetrics().catch(() => null),
  ]);

  const rows = table.rows;
  const get = (m: string) => rows.find((r) => r.metric === m)?.value;
  const users = typeof get("total_users") === "number" ? (get("total_users") as number) : 0;
  const listings = typeof get("total_live_listings") === "number" ? (get("total_live_listings") as number) : 0;
  const bookings30d =
    typeof get("bookings_confirmed_completed_30d") === "number" ? (get("bookings_confirmed_completed_30d") as number) : 0;
  const leadsApprox = typeof get("lead_win_rate_30d") === "number" ? Math.round((get("lead_win_rate_30d") as number) * 100) : 0;

  const revenue30d =
    typeof get("revenue_events_sum_30d") === "number" ? (get("revenue_events_sum_30d") as number) : revenueSnap.revenueEventsSum90d / 3;

  const daily = snapshotsToGrowthPoints(snapshots);
  const weekly = aggregateWeekly(daily);

  const narrativeBlocks = buildNarrativeBlocks({ sampleMode: false, metricsRows: rows });

  const vm: InvestorPitchDashboardVm = {
    generatedAt: new Date().toISOString(),
    sampleMode: false,
    overview: {
      multiHub: [
        "Six hubs on one identity layer — stays, resale, residence, investor capital, and broker OS.",
        "Shared trust, payments, and documents where product enables.",
      ],
      aiLayer: [
        "Human-in-the-loop AI for drafts, scoring, and routing — not autopilot brokerage.",
        "Explainable signals feed executive and growth dashboards.",
      ],
      growthEngine: [
        "Controlled acquisition CRM + invite codes with redemption tracking.",
        "Marketing Hub generates reviewable assets — no silent auto-post.",
      ],
    },
    marketPosition: [
      "LECIPM compounds liquidity across niches that incumbents treat as separate silos.",
      "Québec-first density with regulatory posture suitable for institutional narrative.",
    ],
    liveMetrics: {
      totalUsers: users,
      totalListings: listings,
      bookings30d,
      leads30dApprox,
      revenue30dApprox: revenue30d,
    },
    revenueByHub: hubRev,
    revenueByHubDisclaimer:
      "Split sums RevenueEvent.amount (90d) by event_type keyword classes; uncategorized flows to Other. Finance source of truth may differ.",
    growthDaily: daily.slice(-90),
    growthWeekly: weekly,
    aiHighlights: [
      "Broker CRM lead tiering + last-touch attribution fields for governance.",
      "Investor metrics export pipeline — JSON/CSV for diligence (feature-flagged APIs).",
    ],
    growthActions: [
      acquisition
        ? `Acquisition CRM: ${acquisition.totalContacts} contacts tracked; conversion mix by segment available.`
        : "Acquisition CRM — connect metrics after migration.",
      "Scaling growth bundle powers narrative blocks when enabled in production.",
    ],
    narrativeBlocks,
    acquisitionSnapshot: acquisition
      ? {
          totalContacts: acquisition.totalContacts,
          conversionRateByType: acquisition.conversionRateByType,
        }
      : undefined,
    slides: buildTenSlidePitchDeck({ sampleMode: false, metricsRows: rows }),
  };

  return vm;
}

export async function getInvestorPitchDashboardVm(opts: { sampleMode: boolean }): Promise<InvestorPitchDashboardVm> {
  if (opts.sampleMode) {
    return {
      ...INVESTOR_PITCH_SAMPLE,
      generatedAt: new Date().toISOString(),
    };
  }
  return buildLiveInvestorPitchDashboard();
}
