import type { CompanyMetricsSnapshot } from "../company-metrics/company-metrics.types";

export type OwnerAlertLevel = "info" | "warning" | "critical";

export type OwnerAlert = {
  id: string;
  level: OwnerAlertLevel;
  title: string;
  detail: string;
};

export type OwnerPriority = {
  id: string;
  rank: number;
  title: string;
  rationale: string;
  suggestedAction: string;
};

export type OwnerDashboardPayload = {
  metrics: CompanyMetricsSnapshot;
  alerts: OwnerAlert[];
  priorities: OwnerPriority[];
  estimateNote: string;
};
