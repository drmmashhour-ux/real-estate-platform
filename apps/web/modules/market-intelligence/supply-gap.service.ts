/**
 * Combines internal supply (listings) and demand proxies into opportunity scores — relative ranks, not market-wide forecasts.
 */

import type { MontrealNeighborhoodSegment, MontrealOpportunityRow } from "./market-intelligence.types";
import { nightPriceToBand } from "./neighborhood-clustering.service";

function clamp01(n: number): number {
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Normalize counts to 0–100 using max in cohort (transparent; no fake baselines). */
function toScore(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round(100 * clamp01(value / max));
}

function strategyForGap(args: {
  demandScore: number;
  supplyScore: number;
  listingCount: number;
  bookingCount90d: number;
}): string {
  const { demandScore, supplyScore, listingCount, bookingCount90d } = args;
  if (listingCount === 0 && bookingCount90d > 0) {
    return "Prioritize host outreach in this micro-segment: internal bookings reference the area but published supply is thin.";
  }
  if (demandScore > supplyScore + 15) {
    return "Demand signal exceeds visible supply — prioritize quality listings, host onboarding, and instant-book readiness.";
  }
  if (supplyScore > demandScore + 15 && listingCount >= 3) {
    return "Supply is denser than recent booking velocity — improve differentiation (photos, pricing clarity, trust badges) before paid acquisition.";
  }
  if (bookingCount90d === 0 && listingCount >= 2) {
    return "Listings exist but no recent bookings in window — review pricing, calendar availability, and search visibility.";
  }
  return "Balanced segment — maintain listing quality; test targeted content and referral prompts to grow both sides.";
}

export function buildOpportunityRows(segments: MontrealNeighborhoodSegment[]): MontrealOpportunityRow[] {
  if (segments.length === 0) return [];

  const maxBook = Math.max(1, ...segments.map((s) => s.bookingCount90d));
  const maxList = Math.max(1, ...segments.map((s) => s.listingCount));
  const maxInq = Math.max(1, ...segments.map((s) => s.inquiryCount90d));

  return segments.map((s) => {
    const demandRaw = s.bookingCount90d + 0.35 * s.inquiryCount90d;
    const maxDemandRaw = maxBook + 0.35 * maxInq;
    const demandScore = toScore(demandRaw, maxDemandRaw);
    const supplyScore = toScore(s.listingCount, maxList);
    const opportunityScore = Math.max(
      0,
      Math.min(100, Math.round(demandScore - supplyScore * 0.65 + (s.conversionProxy * 25))),
    );

    const dataQualityNote =
      s.neighborhood === "Montréal (unspecified)" ? "Neighborhood inferred loosely — improve municipality/neighborhood fields for precision." : undefined;

    return {
      neighborhood: s.neighborhood,
      propertyType: s.propertyType,
      priceBand: s.priceBand,
      demandScore,
      supplyScore,
      opportunityScore,
      recommendedStrategy: strategyForGap({
        demandScore,
        supplyScore,
        listingCount: s.listingCount,
        bookingCount90d: s.bookingCount90d,
      }),
      dataQualityNote,
    };
  });
}

export { nightPriceToBand };
