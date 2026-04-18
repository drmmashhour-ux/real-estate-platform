import type { NormalizedSignal } from "../ai-autopilot.types";

export function normalizeSignal(input: Omit<NormalizedSignal, "timestamp"> & { timestamp?: Date }): NormalizedSignal {
  return {
    ...input,
    timestamp: (input.timestamp ?? new Date()).toISOString(),
  };
}
