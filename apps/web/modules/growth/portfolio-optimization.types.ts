export type CampaignPortfolioInput = {
  campaignKey: string;
  spend: number;
  leads: number;
  bookings: number;
  ctr?: number | null;
  conversionRate?: number | null;
  cpl?: number | null;
  ltvEstimate?: number | null;
  ltvToCplRatio?: number | null;
  profitPerLead?: number | null;
  profitabilityStatus?: "PROFITABLE" | "BREAKEVEN" | "UNPROFITABLE" | "INSUFFICIENT_DATA";
  confidenceScore?: number | null;
  trend?: "IMPROVING" | "DECLINING" | "UNSTABLE" | "INSUFFICIENT_DATA" | null;
};

export type PortfolioCampaignScore = {
  campaignKey: string;
  portfolioScore: number;
  qualityLabel: "TOP" | "GOOD" | "WATCH" | "WEAK" | "UNKNOWN";
  reasons: string[];
  warnings: string[];
};

export type BudgetReallocationRecommendation = {
  fromCampaignKey?: string | null;
  toCampaignKey?: string | null;
  fromAmount?: number | null;
  toAmount?: number | null;
  amount: number;
  confidenceScore: number;
  reason: string;
  safeguards: string[];
};

export type PortfolioOptimizationSummary = {
  totalBudget: number;
  reallocatableBudget: number;
  topCampaigns: PortfolioCampaignScore[];
  weakCampaigns: PortfolioCampaignScore[];
  recommendations: BudgetReallocationRecommendation[];
  notes: string[];
};
