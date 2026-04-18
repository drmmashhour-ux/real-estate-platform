export type FunnelId =
  | "guest_bnhub"
  | "host_bnhub"
  | "buyer_fsbo"
  | "broker_platform";

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
};

export type FunnelReport = {
  funnelId: FunnelId;
  windowDays: number;
  steps: FunnelStep[];
  conversionRate: number | null;
  dropoffPoints: { from: string; to: string; rate: number }[];
  recommendedFixes: string[];
};
