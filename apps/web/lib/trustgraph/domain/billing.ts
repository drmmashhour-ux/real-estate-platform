export type SubscriptionStatusDto = {
  subscriptionId: string | null;
  planId: string | null;
  planName: string | null;
  status: string;
  currentPeriodEnd: string | null;
};

export type PlanFeatureFlags = {
  premiumPlacement?: boolean;
  advancedAnalytics?: boolean;
  slaFeatures?: boolean;
  enterpriseDashboards?: boolean;
};
