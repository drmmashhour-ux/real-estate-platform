import { Alert, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";

const K_SEARCH_COUNT = "lecipm_review_search_count_v1";
const K_LAST_PROMPT_MS = "lecipm_review_last_prompt_ms_v1";

const MIN_SEARCHES_BEFORE_PROMPT = 3;
/** Don’t re-prompt too often (App Store / Play best practice). */
const COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;

async function getSearchCount(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(K_SEARCH_COUNT);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function setSearchCount(n: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(K_SEARCH_COUNT, String(n));
  } catch {
    /* ignore */
  }
}

async function canPrompt(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(K_LAST_PROMPT_MS);
    if (!raw) return true;
    const last = parseInt(raw, 10);
    if (!Number.isFinite(last)) return true;
    return Date.now() - last > COOLDOWN_MS;
  } catch {
    return true;
  }
}

async function markPrompted(): Promise<void> {
  try {
    await SecureStore.setItemAsync(K_LAST_PROMPT_MS, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/**
 * Call after a successful search that returned results (AI search or guest search).
 * Prompts once the user reaches {@link MIN_SEARCHES_BEFORE_PROMPT} qualifying searches.
 */
export async function recordSuccessfulSearch(): Promise<void> {
  if (Platform.OS === "web") return;
  const n = (await getSearchCount()) + 1;
  await setSearchCount(n);
  if (n !== MIN_SEARCHES_BEFORE_PROMPT) return;
  if (!(await canPrompt())) return;
  const available = await StoreReview.isAvailableAsync();
  if (!available) return;
  await showReviewAlert();
}

/**
 * Call when the user takes a high-intent action (e.g. book / contact flow).
 */
export async function recordContactOrBookingIntent(): Promise<void> {
  if (Platform.OS === "web") return;
  if (!(await canPrompt())) return;
  const available = await StoreReview.isAvailableAsync();
  if (!available) return;
  await showReviewAlert();
}

async function showReviewAlert(): Promise<void> {
  await new Promise<void>((resolve) => {
    const done = () => resolve();
    Alert.alert("Enjoying LECIPM?", "Help others discover it ⭐", [
      {
        text: "Not now",
        style: "cancel",
        onPress: () => {
          void markPrompted();
          done();
        },
      },
      {
        text: "Rate",
        onPress: () => {
          void (async () => {
            try {
              await StoreReview.requestReview();
            } finally {
              await markPrompted();
            }
            done();
          })();
        },
      },
    ]);
  });
}
