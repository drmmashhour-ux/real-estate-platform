import { config } from "../config.js";
import { analyzeHost } from "../services/operator-service.js";

export async function runHostPerformanceUpdate(): Promise<{ processed: number }> {
  if (!config.listingsServiceUrl) {
    console.log("[host-performance-update] LISTINGS_SERVICE_URL not set; skip.");
    return { processed: 0 };
  }
  try {
    const res = await fetch(`${config.listingsServiceUrl}/hosts?limit=50`);
    const data = res.ok ? await res.json() : { hosts: [] };
    const hosts = Array.isArray(data) ? data : data.hosts ?? [];
    for (const h of hosts) {
      analyzeHost({
        hostId: h.id,
        responseTimeHours: h.responseTimeHours,
        avgRating: h.avgRating,
        cancellationRate: h.cancellationRate,
        listingCompletenessPct: h.listingCompletenessPct,
      });
    }
    console.log("[host-performance-update] Processed", hosts.length, "hosts");
    return { processed: hosts.length };
  } catch (e) {
    console.error("[host-performance-update]", e);
    return { processed: 0 };
  }
}
