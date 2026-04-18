import type { CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import type { ExecutiveScope } from "../owner-access/owner-access.types";
import { getOwnerKpiSnapshot } from "./owner-kpi.service";
import { deriveOwnerAlerts } from "./owner-alerts.service";
import { deriveOwnerPriorities } from "./owner-priority.service";
import type { OwnerDashboardPayload } from "./owner-dashboard.types";

export async function buildOwnerDashboardPayload(
  scope: ExecutiveScope,
  window: CompanyMetricsWindow,
  custom?: { from: string; to: string },
): Promise<OwnerDashboardPayload> {
  const metrics = await getOwnerKpiSnapshot(scope, window, custom);
  return {
    metrics,
    alerts: deriveOwnerAlerts(metrics),
    priorities: deriveOwnerPriorities(metrics),
    estimateNote:
      "Les indicateurs agrégés sont calculés à partir des données internes LECIPM. Toute projection financière utilise l’onglet Scénarios (estimations étiquetées).",
  };
}

export { deriveOwnerAlerts } from "./owner-alerts.service";
export { deriveOwnerPriorities } from "./owner-priority.service";
