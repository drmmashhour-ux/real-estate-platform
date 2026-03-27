import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import { getInvestorMetrics } from "@/modules/investor/investor-metrics";
import { fetchInvestorNewsSummaries } from "@/modules/market/news-service";

export type MarketTrend = {
  label: string;
  direction: "up" | "down" | "flat";
  detail: string;
};

export type MarketIntelligenceResult = {
  dailySummary: string;
  trends: MarketTrend[];
  insights: string[];
  newsHeadlines: string[];
  newsSources: string[];
  newsFetchedAt: string;
  generatedAt: string;
};

/**
 * Combines platform metrics with lightweight heuristics (swap for LLM when ready).
 */
export async function generateMarketSummary(): Promise<{ dailySummary: string; insights: string[] }> {
  const [platform, inv] = await Promise.all([getPlatformStats(14), getInvestorMetrics(14)]);
  const last = platform.series[platform.series.length - 1];
  const prev = platform.series[Math.max(0, platform.series.length - 2)];
  const listingsDelta =
    (last?.listingsBroker ?? 0) +
    (last?.listingsSelf ?? 0) -
    ((prev?.listingsBroker ?? 0) + (prev?.listingsSelf ?? 0));

  const dailySummary = [
    `Trailing 14-day activity: ${platform.totals.listingsTotal} new listings (broker + self-serve),`,
    `${platform.totals.transactionsClosed} transaction events (bookings/payments),`,
    `${inv.kpis.totalUsers.toLocaleString()} registered users.`,
    listingsDelta >= 0
      ? "Listing velocity is stable or improving week over week."
      : "Listing intake softened slightly vs. the prior interval — monitor conversion.",
  ].join(" ");

  const insights = [
    inv.kpis.activeListings > 0
      ? `${inv.kpis.activeListings.toLocaleString()} listings are live across marketplaces.`
      : "Listing inventory is still ramping — focus on seller onboarding.",
    inv.kpis.totalTransactions > 0
      ? `${inv.kpis.totalTransactions} offer/booking/deal events recorded (composite).`
      : "Transaction volume is still early — emphasize trust and liquidity programs.",
  ];

  return { dailySummary, insights };
}

export async function detectTrends(): Promise<MarketTrend[]> {
  const platform = await getPlatformStats(30);
  const trends: MarketTrend[] = [];
  const mid = Math.floor(platform.series.length / 2);
  const first = platform.series.slice(0, mid);
  const second = platform.series.slice(mid);
  const sum = (s: typeof platform.series) => s.reduce((a, r) => a + r.listingsBroker + r.listingsSelf, 0);
  const a = sum(first);
  const b = sum(second);
  if (b > a * 1.05) {
    trends.push({
      label: "Listings",
      direction: "up",
      detail: "New listings accelerated in the second half of the window.",
    });
  } else if (b < a * 0.95) {
    trends.push({
      label: "Listings",
      direction: "down",
      detail: "New listings slowed vs. the first half of the window.",
    });
  } else {
    trends.push({ label: "Listings", direction: "flat", detail: "Listing flow is steady." });
  }

  const txFirst = first.reduce((x, r) => x + r.transactionsClosed, 0);
  const txSecond = second.reduce((x, r) => x + r.transactionsClosed, 0);
  if (txSecond > txFirst) {
    trends.push({
      label: "Transactions",
      direction: "up",
      detail: "Closed transaction signals increased in recent weeks.",
    });
  } else if (txSecond < txFirst) {
    trends.push({
      label: "Transactions",
      direction: "down",
      detail: "Transaction throughput eased — check seasonality and supply.",
    });
  }

  trends.push({
    label: "Macro (informational)",
    direction: "flat",
    detail: "Interest rates and affordability continue to shape buyer urgency — pair with local MLS context.",
  });

  return trends;
}

export async function summarizeNews(): Promise<{ lines: string[] }> {
  const bundle = await fetchInvestorNewsSummaries();
  return { lines: bundle.summaries };
}

export async function getFullMarketIntelligence(): Promise<MarketIntelligenceResult> {
  const [summary, trends, news] = await Promise.all([
    generateMarketSummary(),
    detectTrends(),
    fetchInvestorNewsSummaries(),
  ]);

  return {
    dailySummary: summary.dailySummary,
    trends,
    insights: summary.insights,
    newsHeadlines: news.headlines.slice(0, 12),
    newsSources: news.sources,
    newsFetchedAt: news.fetchedAt,
    generatedAt: new Date().toISOString(),
  };
}
