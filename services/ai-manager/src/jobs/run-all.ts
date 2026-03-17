/**
 * Run all AI Manager jobs once (for cron or manual trigger).
 * Usage: npm run jobs
 */
import { run as runListingAnalysis } from "./daily-listing-analysis.js";
import { run as runDemandForecast } from "./daily-demand-forecast.js";
import { run as runFraudMonitoring } from "./fraud-monitoring.js";

async function main() {
  console.log("Running AI Manager jobs...");
  const [listing, demand, fraud] = await Promise.all([
    runListingAnalysis(),
    runDemandForecast(),
    runFraudMonitoring(),
  ]);
  console.log("Listing analysis:", listing);
  console.log("Demand forecast:", demand);
  console.log("Fraud monitoring:", fraud);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
