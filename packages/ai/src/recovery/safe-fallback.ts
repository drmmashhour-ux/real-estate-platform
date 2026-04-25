import type { AutopilotMode } from "../types";

/** When a domain trips, fall back to recommendations-only platform behavior (caller applies). */
export function fallbackAutonomyMode(): AutopilotMode {
  return "RECOMMENDATIONS_ONLY";
}
