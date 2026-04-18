export type ListingMarketingIntelligenceResult = {
  listingId: string;
  healthScore: number;
  exposureScore: number;
  conversionScore: number;
  contentNeeds: string[];
  opportunities: string[];
  warnings: string[];
  recommendedActions: string[];
  /** Internal-only labels for support; not shown publicly */
  signalSummary: {
    viewsInWindow: number;
    savesInWindow: number;
    inquiriesInWindow: number;
    daysOnMarket: number;
    photoCount: number;
    hasDescription: boolean;
    qualityScore: number | null;
  };
};
