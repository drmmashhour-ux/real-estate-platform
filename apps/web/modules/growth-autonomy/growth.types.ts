export type GrowthChannel = "CONTENT" | "SEO" | "REFERRAL" | "EMAIL" | "LANDING" | "PRICING" | "ONBOARDING" | "PAID";
export type GrowthExperimentStatus = "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";

export interface FunnelSnapshot {
  traffic: number;
  signups: number;
  activationRate: number;
  revenue: number;
  retention: number;
  referralUsage: number;
  landingConversion: number;
  onboardingDropoff: number;
  pricingConversion: number;
}

export interface GrowthHypothesis {
  hypothesis: string;
  channel: GrowthChannel;
  targetMetric: string;
  expectedImpact: "Acquisition" | "Activation" | "Retention" | "Monetization";
  confidence: number; // 0-1
  requiredAssets: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface ChannelScore {
  channel: GrowthChannel;
  score: number;
  rationale: string;
  allocationRecommendation: string;
}

export interface GrowthActionCandidate {
  id: string;
  type: string;
  description: string;
  channel: GrowthChannel;
  priority: number;
  requiresApproval: boolean;
  metadata?: Record<string, any>;
}
