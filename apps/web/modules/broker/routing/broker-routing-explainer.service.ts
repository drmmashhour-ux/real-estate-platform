/**
 * Concise explain lines from scores — only supported reasons; max 5 lines.
 */

import type { BrokerRoutingScoreBreakdown } from "./broker-routing.types";
import type { NormalizedRoutingBroker, NormalizedRoutingLead } from "./broker-routing-normalizer.service";

export type RoutingWhyInput = {
  lead: NormalizedRoutingLead;
  broker: NormalizedRoutingBroker;
  breakdown: BrokerRoutingScoreBreakdown;
};

export function buildBrokerRoutingWhy(input: RoutingWhyInput): string[] {
  const { breakdown, lead, broker } = input;
  const lines: string[] = [];

  const pairs: [keyof BrokerRoutingScoreBreakdown, string][] = [
    ["regionFitScore", "Regional alignment with lead context"],
    ["intentFitScore", "Intent / persona alignment"],
    ["performanceFitScore", "Historical CRM performance profile"],
    ["responseFitScore", "Response speed signals"],
    ["availabilityFitScore", "Current workload proxy (recent CRM activity)"],
  ];

  const scored = pairs
    .map(([k, label]) => ({ k, label, v: breakdown[k] }))
    .sort((a, b) => b.v - a.v);

  for (const row of scored) {
    if (lines.length >= 5) break;
    if (row.v < 58) continue;
    if (row.k === "regionFitScore" && row.v >= 70) lines.push("Strong regional match vs lead city/region signals.");
    else if (row.k === "intentFitScore" && row.v >= 68) lines.push("Good fit for this lead intent given broker persona signals.");
    else if (row.k === "performanceFitScore" && row.v >= 68) lines.push("Higher broker performance score in-sample.");
    else if (row.k === "responseFitScore" && row.v >= 65) lines.push("Faster response / follow-up signals in CRM data.");
    else if (row.k === "availabilityFitScore" && row.v >= 68) lines.push("Lower recent load vs other brokers in this pool.");
    else if (row.v >= 62) lines.push(`${row.label} — above neutral in this model.`);
  }

  if (lines.length === 0) {
    lines.push("Limited distinguishing signals — ranking is weakly separated.");
  }

  if (!lead.regionKey) {
    lines.push("Lead region is thin — regional match is low confidence.");
  }
  if (broker.regionKeys.length === 0) {
    lines.push("Broker market fields are sparse — regional match is approximate.");
  }

  return lines.slice(0, 5);
}
