/**
 * Cache keys for Ultra-Lite JSON snapshots (IndexedDB via @repo/offline).
 */
export function liteListingsSnapshotKey(locale: string): string {
  return `lite:listings:v1:${locale}`;
}

export function liteBookingsSnapshotKey(locale: string): string {
  return `lite:bookings:v1:${locale}`;
}
