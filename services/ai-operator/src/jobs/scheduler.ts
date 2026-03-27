import cron from "node-cron";
import { config } from "../config.js";
import { runDailyListingScan } from "./daily-listing-scan.js";
import { runPricingRefresh } from "./pricing-refresh.js";
import { runFraudScan } from "./fraud-scan.js";
import { runDemandForecastUpdate } from "./demand-forecast-update.js";
import { runHostPerformanceUpdate } from "./host-performance-update.js";
import { runSupportTriageRefresh } from "./support-triage-refresh.js";
import { runMarketplaceHealthCheck } from "./marketplace-health-check.js";

export function startScheduler(): void {
  if (process.env.RUN_JOBS !== "true") return;

  cron.schedule(config.cron.listingScan, () => runDailyListingScan().catch((e) => console.error("[scheduler] listing:", e)));
  cron.schedule(config.cron.pricingRefresh, () => runPricingRefresh().catch((e) => console.error("[scheduler] pricing:", e)));
  cron.schedule(config.cron.fraudScan, () => runFraudScan().catch((e) => console.error("[scheduler] fraud:", e)));
  cron.schedule(config.cron.demandForecast, () => runDemandForecastUpdate().catch((e) => console.error("[scheduler] demand:", e)));
  cron.schedule(config.cron.hostPerformance, () => runHostPerformanceUpdate().catch((e) => console.error("[scheduler] host:", e)));
  cron.schedule(config.cron.supportTriage, () => runSupportTriageRefresh().catch((e) => console.error("[scheduler] support:", e)));
  cron.schedule(config.cron.marketplaceHealth, () => runMarketplaceHealthCheck().catch((e) => console.error("[scheduler] health:", e)));

  console.log("AI Operator scheduler started (RUN_JOBS=true).");
}
