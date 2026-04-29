import "server-only";

/** Outcome telemetry for learning pipelines — callers wrap in try/catch; noop until wired to storage. */
export async function logOutcome(_params: {
  hostId: string;
  listingId: string | null;
  bookingId: string | null;
  ruleName: string;
  actionType: string;
  outcomeType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {}
