/**
 * Pricing trend helpers — thin layer over median comparison (see `marketTrendService`).
 * Kept separate so Deal Analyzer can import pricing-only logic without inventory/demand noise.
 */
export { directionFromMedians, summarizeTrendFromSnapshots } from "./marketTrendService";
