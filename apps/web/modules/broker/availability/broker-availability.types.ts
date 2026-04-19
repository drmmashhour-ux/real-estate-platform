/**
 * Broker availability / capacity / SLA — advisory routing signals only (no auto-send, no payments).
 */

export type BrokerAvailabilityStatus = "available" | "limited" | "unavailable" | "unknown";

/** Pipeline load band — sparse data uses `available` with neutral score. */
export type BrokerCapacityBand = "available" | "limited" | "unavailable";

export type BrokerCapacitySnapshot = {
  brokerId: string;
  activeLeads: number;
  overdueFollowUps: number;
  recentAssignments: number;
  maxActiveLeadsHint?: number | null;
  /** 0–100 — higher means more headroom for new work (bounded, deterministic). */
  capacityScore: number;
  status: BrokerCapacityBand;
  explanation: string;
};

export type BrokerSlaHealth = "good" | "moderate" | "poor" | "insufficient_data";

export type BrokerSlaSnapshot = {
  brokerId: string;
  avgResponseDelayHours?: number | null;
  followUpCompletionRate?: number | null;
  overdueRate?: number | null;
  slaHealth: BrokerSlaHealth;
  explanation: string;
};

export type BrokerRoutingAvailabilitySummary = {
  brokerId: string;
  availabilityStatus: BrokerAvailabilityStatus;
  capacityScore: number;
  slaHealth: BrokerSlaHealth;
  /** Soft routing score delta applied in lead routing (typically −14 … +10). */
  routingAdjustment: number;
  reasons: string[];
};

export type BrokerAvailabilitySnapshot = {
  brokerId: string;
  status: BrokerAvailabilityStatus;
  explanation: string;
};
