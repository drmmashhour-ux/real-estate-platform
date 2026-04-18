import { aggregateCompanyMetrics } from "../company-metrics/company-metrics-aggregation.service";
import type { CompanyMetricsWindow } from "../company-metrics/company-metrics.types";
import type { ExecutiveScope } from "../owner-access/owner-access.types";

export async function getOwnerKpiSnapshot(scope: ExecutiveScope, window: CompanyMetricsWindow, custom?: { from: string; to: string }) {
  return aggregateCompanyMetrics(scope, window, custom);
}
