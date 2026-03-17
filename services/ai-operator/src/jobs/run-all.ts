/**
 * Run all AI Operator scheduled jobs once.
 * Usage: npm run jobs
 */
import { runDailyListingScan } from "./daily-listing-scan.js";
import { runPricingRefresh } from "./pricing-refresh.js";
import { runFraudScan } from "./fraud-scan.js";
import { runDemandForecastUpdate } from "./demand-forecast-update.js";
import { runHostPerformanceUpdate } from "./host-performance-update.js";
import { runSupportTriageRefresh } from "./support-triage-refresh.js";
import { runMarketplaceHealthCheck } from "./marketplace-health-check.js";

async function main() {
  console.log("Running AI Operator jobs...");
  await runDailyListingScan();
  await runPricingRefresh();
  await runFraudScan();
  await runDemandForecastUpdate();
  await runHostPerformanceUpdate();
  await runSupportTriageRefresh();
  await runMarketplaceHealthCheck();
  console.log("All jobs completed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
