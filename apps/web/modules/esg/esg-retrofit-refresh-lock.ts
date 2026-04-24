/**
 * In-memory lock for ESG retrofit refresh to ensure idempotency and prevent load spikes.
 */

interface RefreshLockState {
  lastRefreshAt: number;
  inFlight: boolean;
}

const locks = new Map<string, RefreshLockState>();

/** Default cooldown window: 5 seconds */
const DEFAULT_COOLDOWN_MS = 5000;

/**
 * Checks if a listing is eligible for a retrofit refresh.
 * Returns true if locked (set to inFlight), false if should skip.
 */
export function acquireRefreshLock(listingId: string, cooldownMs = DEFAULT_COOLDOWN_MS): boolean {
  const now = Date.now();
  const state = locks.get(listingId);

  if (state) {
    if (state.inFlight) {
      return false;
    }
    if (now - state.lastRefreshAt < cooldownMs) {
      return false;
    }
  }

  locks.set(listingId, {
    lastRefreshAt: state?.lastRefreshAt ?? 0,
    inFlight: true,
  });

  return true;
}

/**
 * Releases the in-flight lock for a listing.
 */
export function releaseRefreshLock(listingId: string): void {
  const state = locks.get(listingId);
  if (state) {
    locks.set(listingId, {
      ...state,
      inFlight: false,
      lastRefreshAt: Date.now(),
    });
  }
}

/**
 * Reset lock for a listing (e.g. for testing).
 */
export function clearRefreshLock(listingId: string): void {
  locks.delete(listingId);
}
