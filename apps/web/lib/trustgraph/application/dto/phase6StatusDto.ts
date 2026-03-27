export type GeospatialStatusSafeDto = {
  precisionScore: number | null;
  cityAligned: boolean | null;
  publicMessage: string | null;
};

export type GeospatialStatusAdminDto = GeospatialStatusSafeDto & {
  warnings: string[];
  providerSummary: unknown;
};

export type MediaStatusSafeDto = {
  exteriorConfidence: number;
  streetConfidence: number;
  documentMismatchHint: boolean;
};

export type MortgageReadinessEvidenceSafeDto = {
  extractionConfidence: number | null;
  reviewRecommended: boolean;
};
