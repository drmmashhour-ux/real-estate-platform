import type { FeedBucket, RankedDailyDealItem } from "@/src/modules/daily-deal-feed/domain/dailyDealFeed.types";

const LABELS: Record<FeedBucket, string> = {
  top_opportunities: "Top opportunities",
  hidden_gems: "Hidden gems",
  needs_review: "Needs review",
  risky_watchouts: "Risky watchouts",
  bnhub_candidates: "BNHUB candidates",
};

export function assignFeedBucket(item: RankedDailyDealItem): FeedBucket {
  const mode = (item.listingMode ?? "").toUpperCase();
  if (mode.includes("RENT_SHORT") || mode.includes("BNHUB")) return "bnhub_candidates";
  if (item.riskScore >= 70 || item.trustScore < 40) return "risky_watchouts";
  if (item.score >= 78 && item.trustScore >= 60 && item.confidence >= 55) return "top_opportunities";
  if (item.score >= 70 && item.isNewToUser) return "hidden_gems";
  return "needs_review";
}

export function groupFeedItems(items: RankedDailyDealItem[]) {
  const out: Record<FeedBucket, RankedDailyDealItem[]> = {
    top_opportunities: [],
    hidden_gems: [],
    needs_review: [],
    risky_watchouts: [],
    bnhub_candidates: [],
  };
  items.forEach((x, idx) => {
    const bucket = assignFeedBucket(x);
    out[bucket].push({ ...x, bucket, rankPosition: idx + 1 });
  });
  return (Object.keys(out) as FeedBucket[])
    .map((bucket) => ({ bucket, label: LABELS[bucket], items: out[bucket] }))
    .filter((s) => s.items.length > 0);
}
