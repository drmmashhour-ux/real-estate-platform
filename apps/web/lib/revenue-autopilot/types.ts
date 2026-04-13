export type RevenueListingContext = {
  listingId: string;
  listingCode: string;
  title: string;
  city: string;
  revenue90dCents: number;
  views30d: number;
  ctr: number | null;
  conversionRate: number | null;
  pricingScore: number;
  qualityScore: number;
  nightPriceCents: number;
};
