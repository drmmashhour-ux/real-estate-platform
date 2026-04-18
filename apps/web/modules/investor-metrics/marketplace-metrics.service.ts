import { getMarketplaceMetrics } from "@/src/modules/investor-metrics/metricsEngine";

export async function buildMarketplaceMetricsSnapshot(now = new Date()) {
  const m = await getMarketplaceMetrics(now);
  return {
    generatedAt: now.toISOString(),
    ...m,
    disclaimers: [
      "Supply/demand index is a platform-internal ratio — not an MLS or OTA market share claim.",
    ],
  };
}
