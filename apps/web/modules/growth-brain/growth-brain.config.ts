import type { GrowthDomain } from "./growth-brain.types";

/** Tunable weights for prioritization (strategic layer, not financial spend) */
export type PrioritizationWeights = {
  revenueUpside: number;
  urgency: number;
  confidence: number;
  easeOfExecution: number;
  strategicFit: number;
};

export const DEFAULT_PRIORITIZATION_WEIGHTS: PrioritizationWeights = {
  revenueUpside: 0.32,
  urgency: 0.22,
  confidence: 0.18,
  easeOfExecution: 0.14,
  strategicFit: 0.14,
};

/** Hub / product line strategic multipliers (0–1) */
export type HubStrategicPriority = {
  bnhub: number;
  broker: number;
  investor: number;
  residence: number;
  marketing: number;
};

export const DEFAULT_HUB_STRATEGIC_PRIORITY: HubStrategicPriority = {
  bnhub: 0.9,
  broker: 0.85,
  investor: 0.8,
  marketing: 0.75,
  residence: 0.7,
};

export function domainStrategicFit(domain: GrowthDomain, hubs: HubStrategicPriority = DEFAULT_HUB_STRATEGIC_PRIORITY): number {
  switch (domain) {
    case "BNHUB":
      return hubs.bnhub;
    case "BROKER":
      return hubs.broker;
    case "INVESTOR":
      return hubs.investor;
    case "RESIDENCE":
      return hubs.residence;
    case "MARKETING":
    case "SALES":
    case "SUPPLY":
    default:
      return hubs.marketing;
  }
}
