import type { PricingAiSignalBundle } from "./signals.types";

export type DemandAdjustment = {
  demandMultiplier: number;
  reasoning: string[];
};

/**
 * Map funnel + occupancy into a modest multiplier (before global ±30% safety clamp).
 * Internal band kept tight so combined factors rarely hit the safety rail.
 */
export function estimateDemandAdjustment(signals: PricingAiSignalBundle): DemandAdjustment {
  const reasoning: string[] = [];
  let log = 0;

  if (signals.occupancyRate01 != null) {
    if (signals.occupancyRate01 < 0.35) {
      log -= 0.045;
      reasoning.push(
        "Recent occupancy is under ~35%; a small decrease can help fill more nights without giving away the whole rate card.",
      );
    } else if (signals.occupancyRate01 > 0.72) {
      log += 0.04;
      reasoning.push(
        "Recent occupancy is above ~70%; demand for your calendar looks healthy, so a modest increase is reasonable.",
      );
    }
  } else {
    reasoning.push("Occupancy in the last window is not available; demand tilt leans on traffic and comps only.");
  }

  if (signals.locationDemand01 >= 0.68) {
    log += 0.035;
    reasoning.push("Location / discovery demand reads as strong this period.");
  } else if (signals.locationDemand01 <= 0.32) {
    log -= 0.035;
    reasoning.push("Location / discovery demand reads as soft; guests may need a gentler nightly rate.");
  }

  if (signals.listingViews30d >= 25 && signals.viewToStartRate < 0.04) {
    log -= 0.03;
    reasoning.push(
      "Many views but few booking starts — price or expectations may be above what browsers convert at.",
    );
  } else if (signals.listingViews30d >= 10 && signals.viewToStartRate > 0.12) {
    log += 0.02;
    reasoning.push("Healthy view-to-intent conversion; guests engage once they see the listing.");
  }

  if (signals.demandLevelLabel === "high") {
    log += 0.02;
    reasoning.push("Platform demand tier for this listing is marked high.");
  } else if (signals.demandLevelLabel === "low") {
    log -= 0.02;
    reasoning.push("Platform demand tier for this listing is marked low.");
  }

  let demandMultiplier = Math.exp(log);
  demandMultiplier = Math.min(1.08, Math.max(0.92, demandMultiplier));
  return { demandMultiplier, reasoning };
}
