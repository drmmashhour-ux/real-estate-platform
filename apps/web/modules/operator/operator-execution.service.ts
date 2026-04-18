/**
 * Operator execution surface — re-exports One Brain guards so all execution paths can share one policy.
 * Adaptive trust (One Brain V2) does not replace human approval or external sync guardrails.
 * @see operator-one-brain.guard.ts
 */
export {
  brainDecisionFromAssistantRecommendation,
  isOneBrainExecuteAllowedForRecommendation,
} from "./operator-one-brain.guard";
