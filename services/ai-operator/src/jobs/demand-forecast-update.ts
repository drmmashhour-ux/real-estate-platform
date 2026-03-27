import { config } from "../config.js";
import { forecastDemand } from "../services/operator-service.js";

const DEFAULT_MARKETS = ["NYC", "LA", "Miami", "Chicago", "Austin"];

export async function runDemandForecastUpdate(): Promise<{ markets: number }> {
  let markets = DEFAULT_MARKETS;
  if (config.listingsServiceUrl) {
    try {
      const res = await fetch(`${config.listingsServiceUrl}/regions`);
      if (res.ok) {
        const data = await res.json();
        markets = Array.isArray(data) ? data : data.regions ?? markets;
      }
    } catch {
      // use defaults
    }
  }
  for (const market of markets) {
    forecastDemand({ market });
  }
  console.log("[demand-forecast-update] Updated", markets.length, "markets");
  return { markets: markets.length };
}
