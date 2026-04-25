import { runHostAutopilotTrigger, type HostAutopilotTrigger } from "./host-autopilot-engine";

/** Fire-and-forget hooks from product events (never block critical paths). */
export function enqueueHostAutopilot(hostId: string, trigger: HostAutopilotTrigger): void {
  void runHostAutopilotTrigger(hostId, trigger);
}
