import { classifyDbError, isTransientDbFailure } from "./db-error-classification";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type WithDbRetryOptions = {
  /** Max attempts including the first try (default 3). */
  maxAttempts?: number;
  /** Base delay in ms for exponential backoff (default 150). */
  baseDelayMs?: number;
};

/**
 * Retry only transient network/timeout failures. Do not use for every query —
 * intended for readiness probes and similar boot-style checks.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, options?: WithDbRetryOptions): Promise<T> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 3);
  const baseDelayMs = options?.baseDelayMs ?? 150;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const c = classifyDbError(e);
      const retryable = isTransientDbFailure(c) && attempt < maxAttempts;
      if (!retryable) {
        throw e;
      }
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
