import type { ExecutionStepKey } from "./execution-orchestrator";
import { RESIDENTIAL_EXECUTION_STEPS } from "./execution-orchestrator";

export function getStepMeta(key: ExecutionStepKey) {
  return RESIDENTIAL_EXECUTION_STEPS.find((s) => s.key === key);
}

export function nextStep(current: ExecutionStepKey): ExecutionStepKey | null {
  const idx = RESIDENTIAL_EXECUTION_STEPS.findIndex((s) => s.key === current);
  if (idx < 0 || idx >= RESIDENTIAL_EXECUTION_STEPS.length - 1) return null;
  return RESIDENTIAL_EXECUTION_STEPS[idx + 1]!.key;
}
