export const isDbDisabled = process.env.NEXT_PUBLIC_DISABLE_DB === "true";

export async function safeDbCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (isDbDisabled) {
    console.warn("[DB DISABLED] returning mock data");
    return fallback;
  }

  try {
    return await fn();
  } catch (e) {
    console.warn("[DB ERROR]", e);
    return fallback;
  }
}

export { mockListings } from "./mock-data";

/**
 * Do not re-export `queryWithRetry` / `safeQuery` from here — that would pull `pg` into any bundle
 * that imports `@/lib/db-safe`. Import resilience helpers from `@/lib/db` or `@/lib/db/db-safe` on the server only.
 */
