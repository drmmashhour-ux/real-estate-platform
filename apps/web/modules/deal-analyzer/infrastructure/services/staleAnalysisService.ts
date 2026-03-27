import { dealAnalyzerConfig } from "@/config/dealAnalyzer";

export function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

export function needsRefreshDueToStaleness(args: {
  listingUpdatedAt: Date;
  analysisUpdatedAt: Date;
  lastComparableRefreshAt?: Date | null;
}): boolean {
  const th = dealAnalyzerConfig.phase4.refresh.stalenessHours;
  const last = args.lastComparableRefreshAt ?? args.analysisUpdatedAt;
  if (args.listingUpdatedAt.getTime() > last.getTime()) return true;
  return hoursBetween(new Date(), last) > th;
}

export function priceChangeExceedsThreshold(prevCents: number | null, nextCents: number, thresholdPct: number): boolean {
  if (prevCents == null || prevCents <= 0) return false;
  const delta = Math.abs(nextCents - prevCents) / prevCents;
  return delta >= thresholdPct;
}
