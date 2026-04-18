/**
 * Revenue Dashboard V1 — read-only operator visibility (no payment execution).
 */

export type RevenueSource = "lead_unlock" | "booking_fee" | "boost" | "subscription" | "other";

export type RevenueMetricCard = {
  label: string;
  value: number;
  formattedValue: string;
};

export type RevenueAlert = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  description: string;
};

export type RevenueDashboardSummary = {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueBySource: Record<RevenueSource, number>;
  leadsViewed: number;
  leadsUnlocked: number;
  leadUnlockRate: number;
  activeBrokers: number;
  payingBrokers: number;
  revenuePerBroker: number;
  bookingStarts: number;
  bookingCompleted: number;
  bookingCompletionRate: number;
  alerts: RevenueAlert[];
  notes: string[];
  createdAt: string;
};
