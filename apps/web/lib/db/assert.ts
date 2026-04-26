import { USE_NEW_DB } from "../db-switch";

/**
 * Dev-only: call at the start of paths that mix `coreDB` / `getListingsDB` / monolith while
 * experimenting with `USE_NEW_DB=1` on the default `prisma` import.
 */
export function assertSafeUsage(context: string): void {
  if (process.env.NODE_ENV !== "development" || !USE_NEW_DB) {
    return;
  }
  // eslint-disable-next-line no-console
  console.warn(
    `[DB WARNING] ${context} — USE_NEW_DB=1: verify schema coverage for this route's DB calls.`
  );
}
