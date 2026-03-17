/**
 * Cron-based scheduler for AI Manager jobs.
 * Start with the main server when RUN_JOBS=true.
 */
import cron from "node-cron";
import { config } from "../config.js";
import { run as runListingAnalysis } from "./daily-listing-analysis.js";
import { run as runDemandForecast } from "./daily-demand-forecast.js";
import { run as runFraudMonitoring } from "./fraud-monitoring.js";

export function startScheduler(): void {
  if (process.env.RUN_JOBS !== "true") return;

  cron.schedule(config.cron.listingQuality, () => {
    runListingAnalysis().catch((e) => console.error("[scheduler] listing-quality:", e));
  });
  cron.schedule(config.cron.demandForecast, () => {
    runDemandForecast().catch((e) => console.error("[scheduler] demand-forecast:", e));
  });
  cron.schedule(config.cron.fraudMonitoring, () => {
    runFraudMonitoring().catch((e) => console.error("[scheduler] fraud-monitoring:", e));
  });

  console.log("AI Manager scheduler started (RUN_JOBS=true).");
}
