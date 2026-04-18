/**
 * BNHub v2 ranking bundle — all scores are derived from internal data; explanations are factual strings only.
 */
export type BnhubRankingBundle = {
  rankingScore: number;
  qualityScore: number;
  trustScore: number;
  conversionScore: number;
  reasons: string[];
};

export type RankingFeatureVector = {
  listingId: string;
  verified: boolean;
  reviewAverage: number | null;
  reviewCount: number;
  completedStays: number;
  totalBookings: number;
  cancelledBookings: number;
  photoCount: number;
  amenityCount: number;
  descriptionChars: number;
  fraudOpenCount: number;
  trustProfileScore: number | null;
  recencyDays: number;
  priceVsPeerRatio: number | null;
};
