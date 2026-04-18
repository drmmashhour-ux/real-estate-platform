/**
 * Limited retries for transient failures (Stripe connection / rate limit). Does not retry on 4xx logic errors.
 */
function isTransientStripeLikeError(e: unknown): boolean {
  if (e == null) return false;
  const msg = e instanceof Error ? e.message : String(e);
  if (/v8_safety_timeout:/i.test(msg)) return false;
  if (/Stripe/i.test(msg) && /connection|timeout|ECONNRESET|ETIMEDOUT|rate limit|429/i.test(msg)) return true;
  const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
  if (code === "api_connection_error" || code === "rate_limit") return true;
  return false;
}

export async function withTransientRetry<T>(label: string, maxRetries: number, fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (attempt >= maxRetries || !isTransientStripeLikeError(e)) {
        throw e;
      }
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
