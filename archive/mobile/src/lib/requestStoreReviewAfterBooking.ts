import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";

const STORAGE_KEY = "lecipm.store_review_last_request_ms";
const MIN_MS_BETWEEN_PROMPTS = 90 * 24 * 60 * 60 * 1000;
const DELAY_BEFORE_MS = 2500;

let inFlight: Promise<void> | null = null;

/**
 * Prompts for an App Store / Play in-app review after a successful booking context.
 * Throttled: at most once per ~90 days per install (SecureStore) and coalesces concurrent calls.
 * Apple may still cap how often the system sheet appears.
 */
export function requestStoreReviewAfterBooking(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const prev = await SecureStore.getItemAsync(STORAGE_KEY);
      const now = Date.now();
      if (prev) {
        const t = parseInt(prev, 10);
        if (!Number.isNaN(t) && now - t < MIN_MS_BETWEEN_PROMPTS) return;
      }

      if (!(await StoreReview.isAvailableAsync())) return;

      await new Promise<void>((r) => setTimeout(r, DELAY_BEFORE_MS));

      if (!(await StoreReview.isAvailableAsync())) return;
      await StoreReview.requestReview();
      await SecureStore.setItemAsync(STORAGE_KEY, String(Date.now()));
    } catch {
      /* non-fatal */
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
