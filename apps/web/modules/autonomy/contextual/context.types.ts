export type ContextFeatures = {
  occupancyBucket: string;
  adrBucket: string;
  revparBucket: string;
  bookingBucket: string;
  revenueTrendBucket: string;
  occupancyTrendBucket: string;
  weekendBiasBucket: string;
  seasonBucket: string;
  priceTierBucket: string;
};

export type ContextualCandidateAction = {
  domain: string;
  signalKey: string;
  actionType: string;
  payload: Record<string, unknown>;
  reason: string;
  confidence: number;
  ruleWeightId?: string | null;
  originalScore?: number;
  contextualScore?: number;
  selectionScore?: number;
  contextFeatures?: ContextFeatures;
};
