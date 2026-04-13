import type { MapListing } from "@/components/map/MapListing";
import type { MapInsightStats } from "@/lib/ai/map-search-insights";

function medianOfSorted(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function computeMapSearchStats(listings: MapListing[]): MapInsightStats | null {
  const prices = listings.map((l) => l.price).filter((p) => typeof p === "number" && Number.isFinite(p) && p > 0);
  if (prices.length === 0) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  let soldCount = 0;
  let pendingCount = 0;
  for (const l of listings) {
    if (l.transactionKey === "sold") soldCount++;
    else if (l.transactionKey === "offer_received" || l.transactionKey === "offer_accepted") pendingCount++;
  }
  const activeCount = Math.max(0, listings.length - soldCount - pendingCount);
  return {
    count: listings.length,
    medianPrice: medianOfSorted(sorted),
    minPrice: sorted[0]!,
    maxPrice: sorted[sorted.length - 1]!,
    soldCount,
    pendingCount,
    activeCount,
  };
}

export type PriceBucket = { label: string; count: number; fill: string };

/** Histogram buckets for bar chart (visible listings only). */
export function priceHistogram(listings: MapListing[], buckets = 6): PriceBucket[] {
  const prices = listings.map((l) => l.price).filter((p) => typeof p === "number" && Number.isFinite(p) && p > 0);
  if (prices.length === 0) return [];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) {
    return [{ label: formatBucketLabel(min), count: prices.length, fill: "#D4AF37" }];
  }
  const step = (max - min) / buckets;
  const counts = new Array(buckets).fill(0) as number[];
  for (const p of prices) {
    let i = Math.floor((p - min) / step);
    if (i >= buckets) i = buckets - 1;
    if (i < 0) i = 0;
    counts[i]!++;
  }
  const fills = ["#94a3b8", "#a8a29e", "#ca8a04", "#D4AF37", "#b45309", "#0e7490"];
  return counts.map((count, i) => {
    const lo = min + i * step;
    const hi = i === buckets - 1 ? max : min + (i + 1) * step;
    return {
      label: `${formatBucketLabel(lo)}–${formatBucketLabel(hi)}`,
      count,
      fill: fills[i % fills.length]!,
    };
  });
}

function formatBucketLabel(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return `${Math.round(n)}`;
}

export function priceVsMedianLabel(price: number, median: number): string {
  if (!(median > 0)) return "";
  const ratio = price / median;
  if (ratio < 0.92) return "Below typical asks in this view";
  if (ratio > 1.08) return "Above typical asks in this view";
  return "Near the median for this view";
}
