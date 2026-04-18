import { logWarn } from "@/lib/logger";

/** Ops-style alert — goes to structured logs; wire Datadog/PagerDuty externally if needed. */
export function emitOperationalAlert(severity: "info" | "warning" | "critical", title: string, payload: Record<string, unknown>) {
  logWarn(`[alert:${severity}] ${title}`, payload);
}
