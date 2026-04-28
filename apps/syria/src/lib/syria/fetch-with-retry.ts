/**
 * ORDER SYBNB-78 — Resilient fetch for weak networks (browse/search clients).
 */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type FetchWithRetryInit = RequestInit & {
  /** Extra attempts after the first failure (default 2 ⇒ up to 3 tries total). */
  retries?: number;
  retryDelaysMs?: number[];
};

/** Default aligned with SYBNB-78 playbook — brief backoff before surfacing cached listings. */
export const SYBNB78_FETCH_DEFAULT_RETRIES = 2;
export const SYBNB78_FETCH_DEFAULT_DELAYS_MS = [280, 720, 1400] as const;

/**
 * Retries on network errors and transient 5xx / 429. Non-retry responses return as-is.
 */
export async function fetchWithRetry(input: RequestInfo | URL, init?: FetchWithRetryInit): Promise<Response> {
  const { retries = SYBNB78_FETCH_DEFAULT_RETRIES, retryDelaysMs = [...SYBNB78_FETCH_DEFAULT_DELAYS_MS], ...rest } =
    init ?? {};
  const delays = retryDelaysMs.length ? retryDelaysMs : [400];
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, rest);
      if (res.ok) return res;

      const retryableStatus = res.status >= 500 || res.status === 429;
      if (retryableStatus && attempt < retries) {
        await sleep(delays[Math.min(attempt, delays.length - 1)] ?? 400);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(delays[Math.min(attempt, delays.length - 1)] ?? 400);
        continue;
      }
      throw e;
    }
  }

  throw lastErr;
}
