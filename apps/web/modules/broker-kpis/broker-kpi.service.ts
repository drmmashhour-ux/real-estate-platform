import type { BrokerKpiSnapshot, KpiWindow } from "./broker-kpis.types";
import { aggregateBrokerKpis, buildBrokerKpiSnapshot, resolveKpiDateRange } from "./broker-kpi-aggregation.service";

export async function getBrokerKpiBoardSnapshot(
  brokerId: string,
  window: KpiWindow,
  custom?: { from: string; to: string },
): Promise<BrokerKpiSnapshot> {
  const range = resolveKpiDateRange(window, custom);
  const core = await aggregateBrokerKpis(brokerId, range);
  return buildBrokerKpiSnapshot(window, range, core);
}

export { resolveKpiDateRange } from "./broker-kpi-aggregation.service";
