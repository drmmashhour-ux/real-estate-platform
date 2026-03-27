/**
 * Market Intelligence Engine – types and constants.
 */

export const REGION_TYPES = ["city", "municipality", "neighborhood", "postal_area"] as const;
export type RegionType = (typeof REGION_TYPES)[number];

export const TREND_DIRECTIONS = ["up", "down", "stable"] as const;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export interface MarketRegionInput {
  name: string;
  regionType: RegionType;
  parentRegionId?: string | null;
  country?: string;
  province?: string | null;
}

export interface PriceIndexRow {
  marketRegionId: string;
  period: string;
  averagePrice: number | null;
  medianPrice: number | null;
  pricePerUnit: number | null;
  trendDirection: TrendDirection | null;
  sampleSize: number | null;
}

export interface RentIndexRow {
  marketRegionId: string;
  period: string;
  averageRent: number | null;
  medianRent: number | null;
  rentPerUnit: number | null;
  trendDirection: TrendDirection | null;
  sampleSize: number | null;
}

export interface BnhubIndexRow {
  marketRegionId: string;
  period: string;
  averageNightlyRate: number | null;
  averageOccupancy: number | null;
  averageMonthlyRevenue: number | null;
  averageRating: number | null;
  sampleSize: number | null;
}

export interface DemandMetricsRow {
  marketRegionId: string;
  period: string;
  demandScore: number | null;
  searchVolume: number | null;
  bookingVolume: number | null;
  inventoryLevel: number | null;
}

export interface HeatmapZone {
  regionId: string;
  regionName: string;
  regionType: string;
  latitude?: number;
  longitude?: number;
  demandScore?: number;
  averagePrice?: number;
  averageRent?: number;
  averageNightlyRate?: number;
  averageMonthlyRevenue?: number;
  investmentScore?: number;
}
