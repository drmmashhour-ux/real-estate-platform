/**
 * Network quality hint for Rich vs Lite shell (client-only; SSR/build has no `navigator.connection`).
 */

export type NetworkUiMode = "rich" | "lite";

export function getNetworkMode(): NetworkUiMode {
  if (typeof window === "undefined") return "rich";

  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!conn) return "rich";

  const et = String(conn.effectiveType ?? "").toLowerCase();
  if (et === "2g" || et === "slow-2g" || conn.saveData === true) return "lite";
  if (et === "3g") return "lite";

  return "rich";
}

interface NetworkInformation {
  readonly effectiveType?: string;
  readonly saveData?: boolean;
}
