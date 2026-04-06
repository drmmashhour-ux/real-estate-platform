import type { CitySupplyDemandSnapshot } from "./cityMetrics";

/**
 * 0–100 opportunity score from supply/demand + revenue (heuristic; tune with real CAC/LTV).
 */
export function computeExpansionScore(m: CitySupplyDemandSnapshot): number {
  const supply = Math.max(1, m.activeListings);
  const demandSignal = m.leads90d + m.bookings90d * 2;
  const ratio = demandSignal / supply;
  const ratioScore = Math.min(55, Math.round(ratio * 12));
  const revenueScore = Math.min(35, Math.round((m.revenueCents90d / 100 / 10_000) * 10));
  const balancePenalty =
    m.buyerToListingRatio > 8 ? 5 : m.buyerToListingRatio < 0.05 && m.activeListings > 5 ? 8 : 0;
  return Math.max(0, Math.min(100, 15 + ratioScore + revenueScore - balancePenalty));
}

export function rankCitiesByOpportunity(
  rows: Array<{ slug: string; expansionScore: number | null }>
): Array<{ slug: string; score: number }> {
  return [...rows]
    .map((r) => ({ slug: r.slug, score: r.expansionScore ?? 0 }))
    .sort((a, b) => b.score - a.score);
}

export function suggestNextExpansionSlug(
  rows: Array<{ slug: string; status: string; expansionScore: number | null }>
): string | null {
  const candidates = rows
    .filter((r) => r.status === "testing")
    .map((r) => ({ slug: r.slug, score: r.expansionScore ?? 0 }))
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.slug ?? null;
}
