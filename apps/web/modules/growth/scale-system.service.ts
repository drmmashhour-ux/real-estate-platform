import type { ScaleMetric, ScalePlan } from "./scale-system.types";

const CAD = 100_000;
const AVG_LEAD = 100;
const LEADS = 1000;
const BROKERS_MID = 40;

/**
 * Deterministic $100K/month planning math — advisory only.
 */
export function buildScalePlan(): { plan: ScalePlan; metrics: ScaleMetric[] } {
  const plan: ScalePlan = {
    revenueTarget: CAD,
    requiredLeads: LEADS,
    avgPrice: AVG_LEAD,
    brokerCount: BROKERS_MID,
  };

  const metrics: ScaleMetric[] = [
    { name: "Monthly revenue (CAD)", value: 0, target: CAD },
    { name: "Leads / month", value: 0, target: LEADS },
    { name: "Avg lead price (CAD)", value: AVG_LEAD, target: AVG_LEAD },
    { name: "Active brokers (target range)", value: 0, target: 50 },
  ];

  return { plan, metrics };
}
