export type GrowthBrainActionKey = string;

export type GrowthBrainLearnInput = {
  action: GrowthBrainActionKey;
  context: Record<string, unknown>;
  outcome: {
    success: boolean;
    value?: number;
    metadata?: Record<string, unknown>;
  };
};

export type GrowthBrainPredictInput = {
  userId?: string | null;
  listingId?: string | null;
  marketKey?: string | null;
  sessionId?: string | null;
};

export type GrowthBrainPredictResult = {
  conversionScore: number;
  engagementScore: number;
  confidence: number;
  explanation: string[];
};

export type GrowthBrainDecision = {
  approved: boolean;
  channels: string[];
  nextBestAction: string;
  riskScore: number;
  explanation: string[];
};

export type GrowthOpportunityInput = {
  kind: string;
  targetType: string;
  targetId: string;
  score?: number;
  metadata?: Record<string, unknown>;
};
