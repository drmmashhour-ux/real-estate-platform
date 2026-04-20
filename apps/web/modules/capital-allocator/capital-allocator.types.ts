export type ListingAllocationMetrics = {
  listingId: string;
  listingTitle: string;
  grossRevenue: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  bookingCount: number;
  recommendation: string | null;
  recommendationScore: number | null;
  recommendationConfidence: number | null;
  upliftScore: number | null;
  pricingActionSuccess: number | null;
  operatingCostMonthly: number | null;
  improvementBudgetNeed: number | null;
  marketingBudgetNeed: number | null;
  operationalRiskScore: number | null;
  manualCapitalLock: boolean;
};

export type AllocationCandidate = {
  listingId: string;
  listingTitle: string;
  allocationType: "growth" | "pricing" | "operations" | "optimize" | "hold" | "reduce";
  priorityScore: number;
  expectedImpactScore: number;
  confidenceScore: number;
  recommendedAmount: number;
  rationale: string[];
  metrics: ListingAllocationMetrics;
};

/** Final row after proportional split from budget pool. */
export type AllocationPlanLine = AllocationCandidate & {
  allocatedAmount: number;
};

export type AllocationPlanResult = {
  totalBudget: number;
  allocatableBudget: number;
  reserveBudget: number;
  items: AllocationPlanLine[];
};
