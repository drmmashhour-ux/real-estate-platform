/**
 * Pricing engine facade — delegates to per-hub adapters.
 */

import type { HubPricingEngine } from "./hub-pricing-types";
import { getBnhubPricingEngine } from "@/lib/bnhub/hub/bnhub-adapter";

const engines = new Map<string, HubPricingEngine>();

export function registerPricingEngine(hubKey: string, engine: HubPricingEngine): void {
  engines.set(hubKey, engine);
}

export function getPricingEngine(hubKey: string): HubPricingEngine | undefined {
  if (hubKey === "bnhub") return getBnhubPricingEngine();
  return engines.get(hubKey);
}
