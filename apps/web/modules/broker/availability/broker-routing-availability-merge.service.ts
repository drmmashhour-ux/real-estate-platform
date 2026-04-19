/**
 * Merge availability + capacity + SLA into one explainable routing adjustment (soft).
 */

import type {
  BrokerAvailabilitySnapshot,
  BrokerCapacitySnapshot,
  BrokerRoutingAvailabilitySummary,
  BrokerSlaSnapshot,
} from "./broker-availability.types";
import { recordBrokerRoutingAvailabilityMerged } from "./broker-availability-monitoring.service";

export type AvailabilityRoutingFlagBundle = {
  availability: boolean;
  capacity: boolean;
  sla: boolean;
};

function clampAdj(n: number): number {
  return Math.max(-22, Math.min(14, Math.round(n)));
}

export function mergeBrokerRoutingAvailabilitySummary(args: {
  brokerId: string;
  flags: AvailabilityRoutingFlagBundle;
  availability?: BrokerAvailabilitySnapshot | null;
  capacity?: BrokerCapacitySnapshot | null;
  sla?: BrokerSlaSnapshot | null;
}): BrokerRoutingAvailabilitySummary | null {
  const { flags } = args;
  if (!flags.availability && !flags.capacity && !flags.sla) return null;

  const reasons: string[] = [];
  let adj = 0;

  if (flags.availability && args.availability) {
    const a = args.availability;
    if (a.status === "unavailable") {
      adj -= 16;
      reasons.push("Not accepting new leads (declared) — routing deprioritized.");
    } else if (a.status === "limited") {
      adj -= 6;
      reasons.push("Availability marked limited — softer preference.");
    } else if (a.status === "available") {
      adj += 4;
      reasons.push("Accepting new leads — mild routing boost.");
    } else {
      reasons.push("Availability unknown — neutral (no penalty).");
    }
  }

  if (flags.capacity && args.capacity) {
    const c = args.capacity;
    if (c.capacityScore >= 76) {
      adj += 5;
      reasons.push("Lighter active pipeline vs signals — mild boost.");
    } else if (c.capacityScore >= 58) {
      reasons.push("Capacity neutral-to-healthy.");
    } else if (c.capacityScore >= 44) {
      adj -= 5;
      reasons.push("Currently limited capacity — mild penalty.");
    } else {
      adj -= 10;
      reasons.push("Elevated load / overdue proxies — gentle deprioritization (not excluded).");
    }
    if (c.status === "unavailable") adj -= 4;
  }

  if (flags.sla && args.sla) {
    const s = args.sla;
    if (s.slaHealth === "insufficient_data") {
      reasons.push("SLA confidence low due to sparse recent data — neutral.");
    } else if (s.slaHealth === "good") {
      adj += 5;
      reasons.push("Good follow-up discipline — mild boost.");
    } else if (s.slaHealth === "moderate") {
      reasons.push("Moderate SLA posture — neutral.");
    } else {
      adj -= 8;
      reasons.push("SLA strain observed — score softened (override allowed).");
    }
  }

  adj = clampAdj(adj);

  try {
    const sparseSla = Boolean(flags.sla && args.sla?.slaHealth === "insufficient_data");
    recordBrokerRoutingAvailabilityMerged({ adjustment: adj, sparseSla });
  } catch {
    /* noop */
  }

  return {
    brokerId: args.brokerId,
    availabilityStatus: args.availability?.status ?? "unknown",
    capacityScore: args.capacity?.capacityScore ?? 50,
    slaHealth: args.sla?.slaHealth ?? "insufficient_data",
    routingAdjustment: adj,
    reasons,
  };
}
