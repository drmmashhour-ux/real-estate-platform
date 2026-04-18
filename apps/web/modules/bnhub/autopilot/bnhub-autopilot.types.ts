/**
 * BNHub safe autopilot — listing content suggestions with human approval (V1).
 */

export type BNHubAutopilotActionType =
  | "IMPROVE_TITLE"
  | "IMPROVE_DESCRIPTION"
  | "ADD_AMENITIES"
  | "ADD_PHOTO_SUGGESTION"
  | "TRUST_IMPROVEMENT"
  | "PRICING_SUGGESTION";

export type BNHubAutopilotActionStatus = "pending" | "approved" | "executed" | "rejected";

export type BNHubAutopilotPayload =
  | { kind: "title"; proposedTitle: string; reason: string }
  | { kind: "description"; proposedDescription: string; reason: string }
  | { kind: "amenities"; appendAmenities: string[]; reason: string }
  | { kind: "photo_suggestion"; checklist: string[]; reason: string }
  | { kind: "trust"; steps: string[]; reason: string }
  | { kind: "pricing"; note: string; reason: string };

export type BNHubAutopilotAction = {
  id: string;
  listingId: string;
  type: BNHubAutopilotActionType;
  payload: BNHubAutopilotPayload;
  status: BNHubAutopilotActionStatus;
  reversible: boolean;
  createdAt: string;
  /** Human-readable rationale for the panel. */
  why: string;
  impact: "low" | "medium" | "high";
};

/** Snapshot for rollback after a mutating execution. */
export type BNHubAutopilotRollbackSnapshot = {
  actionId: string;
  listingId: string;
  field: "title" | "description" | "amenities";
  previousValue: unknown;
  executedAt: string;
};
