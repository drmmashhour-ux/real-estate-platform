/**
 * Network quality hint for Rich vs Lite shell (client-only; SSR/build has no `navigator.connection`).
 */

export type NetworkUiMode = "rich" | "lite";

export function getNetworkMode(): NetworkUiMode {
  if (typeof window === "undefined") return "rich";

  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!conn) return "rich";

  const et = String(conn.effectiveType ?? "").toLowerCase();
  /** Lite Mode auto: slow cellular + Save-Data (explicit 2g / slow-2g per product spec). */
  if (et === "2g" || et === "slow-2g") return "lite";
  if (conn.saveData === true) return "lite";

  return "rich";
}

interface NetworkInformation {
  readonly effectiveType?: string;
  readonly saveData?: boolean;
}
