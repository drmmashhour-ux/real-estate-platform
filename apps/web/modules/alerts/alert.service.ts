/**
 * LECIPM alert fan-out — logs + optional durable events + optional webhook (no secrets in payload).
 */
import { detectMetricAnomalies } from "@/modules/market-intelligence/anomaly.service";
import { getCoreMetricsBundle, type MetricsRequest } from "@/modules/metrics/metrics.service";
import { previousPeriod } from "@/modules/metrics/timeseries.service";
import { recordPlatformEvent } from "@/lib/observability";
import { logError, logWarn } from "@/lib/logger";
import { anomaliesToAlerts } from "./alert.rules";
import type { CommandCenterAlert, AlertSeverity } from "./alert.types";

export type AlertType =
  | "payment_failure"
  | "booking_failure"
  | "server_error"
  | "deployment"
  /** Failed production deploy / promote — use with non-PII metadata only */
  | "failed_deploy"
  | "stripe_webhook";

/** Command Center — metric anomaly alerts for the selected window vs prior equal-length window. */
export async function getCommandCenterAlerts(req: MetricsRequest): Promise<CommandCenterAlert[]> {
  const current = await getCoreMetricsBundle(req);
  const prev = previousPeriod(req.from, req.toExclusive);
  const prior = await getCoreMetricsBundle({ ...prev, segment: req.segment });
  const flags = detectMetricAnomalies(current, prior);
  return anomaliesToAlerts(flags);
}

export async function triggerAlert(params: {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  /** Non-PII metadata */
  meta?: Record<string, unknown>;
}): Promise<void> {
  const payload = {
    type: params.type,
    severity: params.severity,
    message: params.message,
    ts: new Date().toISOString(),
    ...(params.meta ?? {}),
  };

  if (params.severity === "critical") {
    logError(`[alert:${params.type}] ${params.message}`, payload);
  } else {
    logWarn(`[alert:${params.type}] ${params.message}`, payload);
  }

  try {
    await recordPlatformEvent({
      eventType: `alert_${params.type}`,
      sourceModule: "alerts",
      entityType: "ALERT",
      entityId: `${params.type}:${Date.now()}`,
      payload: payload as Record<string, unknown>,
    });
  } catch {
    /* non-blocking */
  }

  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  if (url && params.severity !== "info") {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: params.message, ...payload }),
      });
    } catch (e) {
      logError("alert webhook failed", e);
    }
  }
}
