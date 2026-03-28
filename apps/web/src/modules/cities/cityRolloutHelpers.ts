import { getLatestStoredCityKpiMetrics } from "@/src/modules/cities/cityKpiEngine";

/** Latest persisted KPI row for rollout / playbook checks. */
export async function latestDailyMetricsForCity(cityKey: string): Promise<Record<string, unknown>> {
  try {
    const m = await getLatestStoredCityKpiMetrics(cityKey);
    return m as unknown as Record<string, unknown>;
  } catch {
    return {};
  }
}
