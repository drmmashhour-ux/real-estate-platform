/**
 * Booking engine facade — delegates to per-hub adapters.
 */

import type { HubBookingEngine } from "./hub-booking-types";
import { getBnhubBookingEngine } from "@/lib/bnhub/hub/bnhub-adapter";

const engines = new Map<string, HubBookingEngine>();

export function registerBookingEngine(hubKey: string, engine: HubBookingEngine): void {
  engines.set(hubKey, engine);
}

export function getBookingEngine(hubKey: string): HubBookingEngine | undefined {
  if (hubKey === "bnhub") return getBnhubBookingEngine();
  return engines.get(hubKey);
}
