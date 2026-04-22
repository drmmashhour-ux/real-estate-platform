import { dispatchAdminNotification } from "@/modules/notifications/notify";
import { sendExpoPushToAdminUsers } from "@/modules/notifications/push.service";

import type { AdminAnomalyVm } from "./admin-intelligence.types";
import { detectAdminAnomalies } from "./admin-anomaly.service";

/**
 * Email + Expo push for HIGH-severity anomalies. Intended for cron (`/api/cron/admin-intelligence-alerts`),
 * not for per-page-view (avoid spam).
 */
export async function notifyAdminsOfCriticalAnomalies(anomalies: AdminAnomalyVm[]): Promise<{
  emailOk: boolean;
  pushOk: boolean;
}> {
  const critical = anomalies.filter((a) => a.severity === "HIGH");
  if (critical.length === 0) {
    return { emailOk: true, pushOk: true };
  }

  const body = critical.map((c) => `• ${c.title}\n  ${c.explanation}\n  → ${c.recommendedAction}`).join("\n\n");

  const r = await dispatchAdminNotification({
    event: { type: "RISK_ANOMALY", code: "ADMIN_DASHBOARD_ANOMALY", detail: body.slice(0, 500) },
    subject: `LECIPM · ${critical.length} critical dashboard signal(s)`,
    bodyText: `Admin intelligence flagged ${critical.length} HIGH item(s):\n\n${body}`,
  });

  const pushBody = critical[0]
    ? `${critical[0].title}${critical.length > 1 ? ` (+${critical.length - 1} more)` : ""}`
    : "Critical admin signals";
  const pushOk = await sendExpoPushToAdminUsers("LECIPM command center", pushBody);

  return { emailOk: r.emailOk, pushOk };
}

/** Load + notify in one step (cron). */
export async function runAdminAnomalyNotifications(): Promise<{
  count: number;
  emailOk: boolean;
  pushOk: boolean;
}> {
  const anomalies = await detectAdminAnomalies();
  const r = await notifyAdminsOfCriticalAnomalies(anomalies);
  return { count: anomalies.filter((a) => a.severity === "HIGH").length, ...r };
}
