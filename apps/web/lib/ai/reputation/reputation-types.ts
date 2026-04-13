/**
 * BNHUB host reputation — explainable, bounded, real signals only.
 * Does not hide listings or block accounts by score alone.
 */

export type HostReputationTier = "excellent" | "good" | "needs_improvement" | "at_risk";

export type HostReputationSignalKey =
  | "completion_rate"
  | "cancellation_rate"
  | "response_rate"
  | "response_time_hours"
  | "checklist_completion"
  | "dispute_count"
  | "dispute_rate"
  | "review_average"
  | "review_volume"
  | "repeat_guest_share";

export type HostReputationSignalsUsed = Partial<
  Record<HostReputationSignalKey, string | number | boolean | null>
>;

export type HostReputationResult = {
  hostId: string;
  /** 0–100 inclusive */
  score: number;
  tier: HostReputationTier;
  reasons: string[];
  signalsUsed: HostReputationSignalsUsed;
  /** Subscores 0–100 for transparency */
  components: {
    reliability: number;
    responsiveness: number;
    guestSatisfaction: number;
    consistency: number;
    /** 0–100 severity used only to subtract (higher = worse disputes) */
    disputeSeverity: number;
  };
  /** When true, score is damped toward neutral — not a penalty */
  limitedHistory: boolean;
  improvementSuggestions: string[];
};
