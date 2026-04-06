export type MonitoringTimeRange = "today" | "7d" | "30d";

export type MonitoringLocaleFilter = "all" | "en" | "fr" | "ar";

export type MonitoringMarketFilter = "all" | "default" | "syria";

export interface MonitoringFilters {
  range: MonitoringTimeRange;
  locale: MonitoringLocaleFilter;
  market: MonitoringMarketFilter;
}

export type HealthTraffic = "green" | "yellow" | "red";

export interface HealthSubsystem {
  id: string;
  label: string;
  traffic: HealthTraffic;
  detail: string;
}

export interface MonitoringAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
}

export interface BookingMetricsSlice {
  createdInRange: number;
  byStatus: Record<string, number>;
  awaitingHostApproval: number;
  pendingManualSettlement: number;
  cancelledInRange: number;
  onlineStripeCheckoutPayments: number;
  manualTrackedBookings: number;
  /** Sample rows for ops table */
  attentionBookings: Array<{
    id: string;
    status: string;
    manualPaymentSettlement: string;
    checkIn: string;
    createdAt: string;
    listingId: string;
  }>;
}

export interface PaymentMetricsSlice {
  paymentsCreated: number;
  byStatus: Record<string, number>;
  withCheckoutSession: number;
  failed: number;
  completed: number;
  webhookEvents: number;
  webhookByType: Record<string, number>;
  recentFailed: Array<{ id: string; status: string; bookingId: string; createdAt: string }>;
}

export interface LocaleMetricsSlice {
  funnelEventsByLocale: Record<string, number>;
  languageSwitchedEvents: number;
}

export interface MarketMetricsSlice {
  platformActiveMarketCode: string | null;
  syriaModeEnabled: boolean | null;
  onlinePaymentsEnabled: boolean | null;
  manualPaymentTrackingEnabled: boolean | null;
  funnelMarketSignals: Record<string, number>;
}

export interface AiMetricsSlice {
  recommendationsCreated: number;
  recommendationsByStatus: Record<string, number>;
  approvalPending: number;
  approvalApproved: number;
  approvalRejected: number;
}

export interface NotificationMetricsSlice {
  notificationsCreated: number;
  byType: Record<string, number>;
}

export interface ErrorMetricsSlice {
  totalInRange: number;
  byType: Record<string, number>;
  recent: Array<{
    id: string;
    errorType: string;
    message: string;
    route: string | null;
    createdAt: string;
  }>;
}

export interface LaunchHealthSummary {
  subsystems: HealthSubsystem[];
  score: number;
  alerts: MonitoringAlert[];
}

export interface E2ESignalSummary {
  lastRunAt: string | null;
  scenarioPassRate: number | null;
  failedScenarioCount: number;
  blockedScenarioCount: number;
  recommendation: "safe_to_launch" | "launch_with_caution" | "not_ready" | "unknown";
  rawPath: string;
}

export interface MonitoringSnapshot {
  generatedAt: string;
  filters: MonitoringFilters;
  window: { startIso: string; endIso: string };
  bookings: BookingMetricsSlice;
  payments: PaymentMetricsSlice;
  locales: LocaleMetricsSlice;
  markets: MarketMetricsSlice;
  ai: AiMetricsSlice;
  notifications: NotificationMetricsSlice;
  errors: ErrorMetricsSlice;
  health: LaunchHealthSummary;
  e2e: E2ESignalSummary;
}
