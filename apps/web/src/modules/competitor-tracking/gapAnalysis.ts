import type { MonopolyCompetitorSnapshot } from "@prisma/client";

export type PricingGap = {
  oursAvgCents: number | null;
  theirsAvgCents: number | null;
  gapPercent: number | null;
};

export function computePricingGap(snapshot: MonopolyCompetitorSnapshot): PricingGap {
  const ours = snapshot.avgPriceCentsOurs;
  const theirs = snapshot.avgPriceCentsTheirs;
  if (ours == null || theirs == null || theirs === 0) {
    return { oursAvgCents: ours, theirsAvgCents: theirs, gapPercent: null };
  }
  const gapPercent = Math.round(((ours - theirs) / theirs) * 1000) / 10;
  return { oursAvgCents: ours, theirsAvgCents: theirs, gapPercent };
}

export function summarizeListingShare(snapshot: MonopolyCompetitorSnapshot): {
  platform: number | null;
  competitor: number | null;
  sharePercent: number | null;
} {
  const p = snapshot.platformListingCount;
  const c = snapshot.competitorEstimate;
  if (p == null || c == null || p + c === 0) return { platform: p, competitor: c, sharePercent: null };
  return {
    platform: p,
    competitor: c,
    sharePercent: Math.round((p / (p + c)) * 1000) / 10,
  };
}
