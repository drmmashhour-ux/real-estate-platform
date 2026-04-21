import { executiveLog } from "./executive-log";

/**
 * Bounded learning placeholder — wire to portfolio learning / outcome tables later.
 * Never mutates policy outside safe ranges without audit (Part 9).
 */
export function recordBoundedLearningSignal(signal: { family: string; deltaWeight: number; note: string }) {
  executiveLog.monitoring("learning_signal_recorded_stub", {
    family: signal.family,
    deltaWeight: signal.deltaWeight,
  });
}
