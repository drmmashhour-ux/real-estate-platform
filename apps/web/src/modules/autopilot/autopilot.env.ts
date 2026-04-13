import { engineFlags } from "@/config/feature-flags";
import type { LecipmCoreAutopilotExecutionMode } from "./types";

function parseMode(raw: string | undefined): LecipmCoreAutopilotExecutionMode {
  const u = raw?.trim().toUpperCase();
  if (u === "OFF" || u === "ASSIST" || u === "SAFE_AUTOPILOT" || u === "FULL_AUTOPILOT_APPROVAL") {
    return u;
  }
  return "ASSIST";
}

/** Global mode from env; listing autopilot feature flag must be on for engine runs. */
export function getLecipmCoreAutopilotMode(): LecipmCoreAutopilotExecutionMode {
  if (!engineFlags.listingAutopilotV1) return "OFF";
  return parseMode(process.env.LECIPM_CORE_AUTOPILOT_MODE);
}
