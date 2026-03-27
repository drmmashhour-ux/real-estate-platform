import { logError, logInfo, logWarning } from "@/lib/logging";
import { trackCriticalEvent } from "@/lib/metrics";

export type AlertPayload = {
  title: string;
  message?: string;
  requestId?: string | null;
  meta?: Record<string, unknown>;
};

/**
 * Stubs: logs structured lines. Wire to Slack/email/webhook via env in production.
 */
export function sendCriticalAlert(payload: AlertPayload) {
  trackCriticalEvent("alert_critical", { title: payload.title, ...payload.meta });
  logError(`ALERT_CRITICAL: ${payload.title}`, {
    requestId: payload.requestId,
    meta: { message: payload.message, ...payload.meta },
  });
}

export function sendWarningAlert(payload: AlertPayload) {
  logWarning(`ALERT_WARNING: ${payload.title}`, {
    requestId: payload.requestId,
    meta: { message: payload.message, ...payload.meta },
  });
}

export function sendInfoAlert(payload: AlertPayload) {
  logInfo(`ALERT_INFO: ${payload.title}`, {
    requestId: payload.requestId,
    meta: { message: payload.message, ...payload.meta },
  });
}
