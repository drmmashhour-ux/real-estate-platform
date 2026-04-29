import "server-only";

/** Gate host-autopilot REST — default allow in staging stubs; tighten via env when wiring prod. */
export function isHostAutopilotRunApiEnabled(): boolean {
  return process.env.HOST_AUTOPILOT_RUN_API_ENABLED !== "0";
}
