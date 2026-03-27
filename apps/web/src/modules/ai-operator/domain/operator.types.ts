import type { AiOperatorActionType, AiOperatorContext } from "@/src/modules/ai-operator/domain/operator.enums";

/** Explainable proposal before persistence. */
export type GeneratedAiOperatorAction = {
  type: AiOperatorActionType;
  context: AiOperatorContext;
  title: string;
  description: string;
  /** WHY this was suggested (human-readable). */
  reason: string;
  confidenceScore: number;
  /** Machine-oriented hint for executeAction / UI deep links. */
  suggestedExecution: Record<string, unknown>;
  dataUsedSummary: string;
  expectedOutcome: string;
  payload: Record<string, unknown>;
};

export type ActionExecutionResult = {
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
};
