import "server-only";

/** Manual / scheduled autopilot scans — noop until BNHost brain actions are rebuilt. */
export async function runHostAutopilotTrigger(
  _hostUserId: string,
  _ctx: { type: string },
): Promise<void> {}
