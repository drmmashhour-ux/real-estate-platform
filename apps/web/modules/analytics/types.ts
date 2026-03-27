/** Admin operations & KPI analytics (read-only aggregates). */

export type AdminDateRangePreset = "7d" | "30d" | "custom";

export type AdminDateRange = {
  preset: AdminDateRangePreset;
  /** ISO date strings (start inclusive, end exclusive for day boundaries). */
  from: string;
  to: string;
};

export type DashboardOverview = {
  users: { total: number; active: number };
  clients: { total: number };
  deals: { active: number };
  offers: {
    total: number;
    submitted: number;
    underReview: number;
    accepted: number;
    rejected: number;
    countered: number;
  };
  contracts: {
    total: number;
    signed: number;
    pending: number;
    completed: number;
  };
  appointments: {
    total: number;
    pending: number;
    completed: number;
    upcoming: number;
  };
  documents: { total: number };
  portfolio: { investmentDeals: number };
};

export type FunnelStage = {
  name: string;
  count: number;
  /** 0–100, null for first stage. */
  conversionRate: number | null;
};

export type WorkflowFunnel = {
  stages: FunnelStage[];
};

export type PendingActionGroup = {
  key: string;
  label: string;
  count: number;
  urgency: "low" | "medium" | "high";
};

export type PendingActionsSummary = {
  groups: PendingActionGroup[];
  total: number;
};

export type UsageMetrics = {
  range: AdminDateRange;
  messagesSent: number;
  documentsUploaded: number;
  offersCreated: number;
  contractsGenerated: number;
  appointmentsBooked: number;
  mostActiveUsers: { userId: string; name: string | null; email: string; count: number }[];
  mostActiveBrokers: { userId: string; name: string | null; email: string; count: number }[];
};

export type BottleneckSeverity = "LOW" | "MEDIUM" | "HIGH";

export type Bottleneck = {
  type: string;
  label: string;
  count: number;
  avgDelayHours: number | null;
  severity: BottleneckSeverity;
};

export type TimeSeriesPoint = {
  date: string;
  newUsers: number;
  newClients: number;
  offersCreated: number;
  contractsSigned: number;
  appointmentsBooked: number;
  documentsUploaded: number;
};

export type ActivityFeedItem = {
  type: string;
  message: string;
  timestamp: string;
  link: string | null;
};
