/**
 * Declared availability + safe activity hints — missing data stays unknown (not “unavailable”).
 */

import type { BrokerServiceProfileStored } from "@/modules/broker/profile/broker-profile.types";
import type { BrokerAvailabilitySnapshot } from "./broker-availability.types";
import { recordBrokerAvailabilitySnapshotBuilt } from "./broker-availability-monitoring.service";

export type BuildBrokerAvailabilityInput = {
  brokerId: string;
  /** When false, profile JSON was not loaded for this broker (do not infer pause). */
  profileLoaded: boolean;
  stored?: BrokerServiceProfileStored | null;
  /** Days since last CRM touch when known (optional — from team-style rollups). */
  inactiveDaysApprox?: number | null;
};

export function buildBrokerAvailabilitySnapshot(input: BuildBrokerAvailabilityInput): BrokerAvailabilitySnapshot {
  try {
    recordBrokerAvailabilitySnapshotBuilt({ sparse: !input.profileLoaded });
  } catch {
    /* noop */
  }

  if (!input.profileLoaded || input.stored == null) {
    return {
      brokerId: input.brokerId,
      status: "unknown",
      explanation: "No declared broker service profile loaded — availability treated as unknown (neutral routing).",
    };
  }

  if (input.stored.capacity.acceptingNewLeads === false) {
    return {
      brokerId: input.brokerId,
      status: "unavailable",
      explanation: "Profile marks not accepting new leads — routing should deprioritize (manual override still allowed).",
    };
  }

  const inactive = input.inactiveDaysApprox;
  if (inactive != null && inactive > 14) {
    return {
      brokerId: input.brokerId,
      status: "limited",
      explanation: `No CRM touch signal for ~${Math.round(inactive)}d — capacity may be uncertain; marked limited (not blocked).`,
    };
  }

  return {
    brokerId: input.brokerId,
    status: "available",
    explanation: "Profile accepts new leads — availability baseline is open.",
  };
}
