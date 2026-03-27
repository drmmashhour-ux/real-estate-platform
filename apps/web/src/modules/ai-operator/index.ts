export type { AiOperatorContext, AiOperatorActionType, AiOperatorAutonomyMode } from "@/src/modules/ai-operator/domain/operator.enums";
export { AI_OPERATOR_CONTEXTS, AI_OPERATOR_ACTION_TYPES, AI_OPERATOR_AUTONOMY_MODES } from "@/src/modules/ai-operator/domain/operator.enums";
export type { GeneratedAiOperatorAction, ActionExecutionResult } from "@/src/modules/ai-operator/domain/operator.types";
export { generateActions } from "@/src/modules/ai-operator/application/generateActions";
export { executeAction } from "@/src/modules/ai-operator/application/executeAction";
export { runActionHandler } from "@/src/modules/ai-operator/application/actionHandlers";
export {
  requiresExplicitApproval,
  allowedInAutoRestrictedMode,
  isDestructiveOrOutbound,
} from "@/src/modules/ai-operator/policies/safety";
export { normalizeAutonomyMode, shouldAutoExecuteOnIngest } from "@/src/modules/ai-operator/policies/autonomy";
export {
  getOrCreateSettings,
  updateAutonomyMode,
  listActionsForUser,
  getActionForUser,
  persistGeneratedActions,
  approveAction,
  rejectAction,
  saveEditedPayload,
  learningStats,
} from "@/src/modules/ai-operator/infrastructure/aiOperatorRepository";
