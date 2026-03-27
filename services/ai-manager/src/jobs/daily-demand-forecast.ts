/**
 * Daily demand forecast job.
 * In production: fetch regions from listings/search service, run getDemandForecast per region, store or notify.
 */
import { config } from "../config.js";
import { getDemandForecast } from "../services/demand-forecast.service.js";

export const JOB_NAME = "daily-demand-forecast";

const DEFAULT_REGIONS = ["NYC", "LA", "Miami", "Chicago", "Austin"];

export async function run(): Promise<{ regionsProcessed: number }> {
  let regions = DEFAULT_REGIONS;
  if (config.listingsServiceUrl) {
    try {
      const res = await fetch(`${config.listingsServiceUrl}/regions`);
      if (res.ok) {
        const data = await res.json();
        regions = Array.isArray(data) ? data : data.regions ?? regions;
      }
    } catch {
      // use defaults
    }
  }

  for (const region of regions) {
    getDemandForecast({
      region,
      fromDate: new Date().toISOString().slice(0, 10),
      toDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  }
  console.log(`[${JOB_NAME}] Forecast generated for ${regions.length} regions.`);
  return { regionsProcessed: regions.length };
}
