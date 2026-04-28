/**
 * Persisted outbound action waiting for connectivity.
 * Mirrors product expectations (Syria marketplace + BN/SYBNB-style flows).
 */
export type OfflineActionType =
  | "message"
  | "booking_request"
  | "approve"
  | "decline";

export type OfflineActionPayload = Record<string, unknown>;

export interface OfflineAction {
  /** Stable synthetic id — use crypto.randomUUID in the browser when enqueueing */
  id: string;
  type: OfflineActionType;
  payload: OfflineActionPayload;
  /** Monotonic optimistic version for replay / conflict tooling */
  clientVersion: number;
  retries: number;
  createdAt: number;
}
