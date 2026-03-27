export type StorageStatus = "safe" | "warning" | "critical" | "full";

/**
 * Compute storage status from used/limit for alerts and blocking.
 * - full: 100%+ → block uploads
 * - critical: 90%+ → urgent alert
 * - warning: 70%+ → alert user
 * - safe: <70%
 */
export function getStorageStatus(used: number, limit: number): StorageStatus {
  if (limit <= 0) return "safe";
  const percent = (used / limit) * 100;

  if (percent >= 100) return "full";
  if (percent >= 90) return "critical";
  if (percent >= 70) return "warning";
  return "safe";
}
