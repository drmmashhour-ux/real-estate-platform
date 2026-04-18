/**
 * Montreal-focused market intelligence — scores derive from platform aggregates only (no external fabricated demand).
 */

export type PriceBand = "budget" | "mid" | "premium" | "luxury";

export type MontrealNeighborhoodSegment = {
  /** Stable bucket label (borough, municipality, or “unspecified”). */
  neighborhood: string;
  propertyType: string | null;
  priceBand: PriceBand;
  listingCount: number;
  publishedListingCount: number;
  /** Confirmed + completed + pending paid pipeline bookings in window (internal BNHub). */
  bookingCount90d: number;
  /** CRM leads tied to BNHub stays in this bucket (internal). */
  inquiryCount90d: number;
  /** Avg night price in cents for published listings in bucket (null if none). */
  avgNightPriceCents: number | null;
  /** Views / listing proxy: completed stays / listing (0 if no listings). */
  conversionProxy: number;
};

export type MontrealOpportunityRow = {
  neighborhood: string;
  propertyType: string | null;
  priceBand: PriceBand;
  demandScore: number;
  supplyScore: number;
  opportunityScore: number;
  recommendedStrategy: string;
  dataQualityNote?: string;
};

export type MontrealMarketSnapshot = {
  market: "Montreal";
  generatedAt: string;
  windowDays: number;
  segments: MontrealNeighborhoodSegment[];
  opportunities: MontrealOpportunityRow[];
  disclaimers: string[];
};

/** Command-center / insight feed row (rule-based; internal metrics only). */
export type MarketInsight = {
  id: string;
  severity: string;
  title: string;
  detail: string;
  basedOn: string[];
};

/** Metric-shape anomaly vs prior window (same length). */
export type AnomalyFlag = {
  code: string;
  severity: string;
  message: string;
};
