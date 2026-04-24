import { trackCeoOutcomeForMemory, trackCeoOutcomes } from "./ceo-outcome-tracker.service";

/**
 * Back-compat facade — delegates to {@link trackCeoOutcomes} (real metrics only, no simulated after-state).
 */
export class CeoOutcomeEvaluatorService {
  static evaluatePendingOutcomes = trackCeoOutcomes;

  static async evaluateCeoDecisionOutcome(memoryId: string) {
    return trackCeoOutcomeForMemory(memoryId);
  }
}
