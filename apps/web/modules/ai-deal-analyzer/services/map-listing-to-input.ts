import type { DealAnalyzerInput } from "./types";

/** Minimal listing fields for analyzer mapping. */
export type ListingRowForAnalyzer = {
  id: string;
  city: string;
  propertyType: string | null;
  beds: number;
  baths: number;
  bedrooms: number | null;
  nightPriceCents: number;
};

/** Demo snapshots when DB has no row (matches design-studio demo listings). */
export const DEMO_ANALYZER_LISTINGS: Record<
  string,
  { title: string; city: string; nightPriceCents: number; propertyType: string; beds: number; baths: number }
> = {
  "1": { title: "Luxury Villa", city: "Demo City", nightPriceCents: 20000, propertyType: "Villa", beds: 3, baths: 2 },
  "test-listing-1": {
    title: "Luxury Villa",
    city: "Demo City",
    nightPriceCents: 20000,
    propertyType: "Villa",
    beds: 3,
    baths: 2,
  },
  "demo-listing-montreal": {
    title: "Cozy loft in Old Montreal",
    city: "Montreal",
    nightPriceCents: 12500,
    propertyType: "Apartment",
    beds: 2,
    baths: 1,
  },
};

/**
 * Rough illustrative list price from nightly STR rate (demo / education only).
 * Not a market valuation.
 */
export function deriveIllustrativeListPriceUsd(nightPriceCents: number): { usd: number; isIllustrative: true } {
  const nightUsd = nightPriceCents / 100;
  const annualGrossStrUsd = nightUsd * 365 * 0.5;
  const grm = 15;
  const raw = annualGrossStrUsd * grm;
  const rounded = Math.round(raw / 1000) * 1000;
  return { usd: Math.max(50_000, rounded), isIllustrative: true };
}

export function listingToAnalyzerInput(listing: ListingRowForAnalyzer): DealAnalyzerInput {
  const { usd, isIllustrative } = deriveIllustrativeListPriceUsd(listing.nightPriceCents);
  const bedrooms = listing.bedrooms ?? listing.beds;
  return {
    listingId: listing.id,
    price: usd,
    city: listing.city,
    propertyType: listing.propertyType?.trim() || "Short-term rental",
    bedrooms,
    bathrooms: listing.baths,
    areaSqft: null,
    estimatedRent: null,
    condoFeesMonthly: null,
    propertyTaxAnnual: null,
    downPaymentPercent: null,
    mortgageRate: null,
    amortizationYears: null,
    priceIsIllustrative: isIllustrative,
  };
}

export function demoSnapshotToInput(id: string): DealAnalyzerInput | null {
  const d = DEMO_ANALYZER_LISTINGS[id];
  if (!d) return null;
  const { usd, isIllustrative } = deriveIllustrativeListPriceUsd(d.nightPriceCents);
  return {
    listingId: id,
    price: usd,
    city: d.city,
    propertyType: d.propertyType,
    bedrooms: d.beds,
    bathrooms: d.baths,
    areaSqft: null,
    estimatedRent: null,
    condoFeesMonthly: null,
    propertyTaxAnnual: null,
    downPaymentPercent: null,
    mortgageRate: null,
    amortizationYears: null,
    priceIsIllustrative: isIllustrative,
  };
}
