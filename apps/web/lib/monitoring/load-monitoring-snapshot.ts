import { buildLaunchHealth } from "./build-launch-health";
import { collectAiMetrics } from "./collect-ai-metrics";
import { collectBookingMetrics } from "./collect-booking-metrics";
import { collectErrorMetrics } from "./collect-error-metrics";
import { collectLocaleMetrics } from "./collect-locale-metrics";
import { collectMarketMetrics } from "./collect-market-metrics";
import { collectNotificationMetrics } from "./collect-notification-metrics";
import { collectPaymentMetrics } from "./collect-payment-metrics";
import { readE2ESignal } from "./read-e2e-signal";
import type { MonitoringFilters, MonitoringSnapshot } from "./types";
import { boundsForMonitoringRange } from "./time-range";

const DEFAULT_FILTERS: MonitoringFilters = {
  range: "7d",
  locale: "all",
  market: "all",
};

export async function loadMonitoringSnapshot(
  partial: Partial<MonitoringFilters> = {},
): Promise<MonitoringSnapshot> {
  const filters: MonitoringFilters = { ...DEFAULT_FILTERS, ...partial };
  const { start, end } = boundsForMonitoringRange(filters.range);

  const [bookings, payments, locales, markets, ai, notifications, errors] = await Promise.all([
    collectBookingMetrics(start, end),
    collectPaymentMetrics(start, end),
    collectLocaleMetrics(start, end, filters.locale),
    collectMarketMetrics(start, end),
    collectAiMetrics(start, end),
    collectNotificationMetrics(start, end),
    collectErrorMetrics(start, end),
  ]);

  const health = buildLaunchHealth({ bookings, payments, errors, ai, notifications });
  const e2e = readE2ESignal();

  return {
    generatedAt: new Date().toISOString(),
    filters,
    window: { startIso: start.toISOString(), endIso: end.toISOString() },
    bookings,
    payments,
    locales,
    markets,
    ai,
    notifications,
    errors,
    health,
    e2e,
  };
}
