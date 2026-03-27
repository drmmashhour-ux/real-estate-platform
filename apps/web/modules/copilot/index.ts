export { runCopilot } from "@/modules/copilot/application/runCopilot";
export {
  mapIntentToAction,
  mapIntentToActionDescriptor,
  type IntentActionDescriptor,
} from "@/modules/copilot/application/mapIntentToAction";
export {
  isCopilotEnabled,
  isCopilotInvestorEnabled,
  isCopilotBrokerEnabled,
  isCopilotSellerEnabled,
  isCopilotPortfolioEnabled,
} from "@/modules/copilot/config";
export { CopilotUserIntent, COPILOT_INTENT_LABELS } from "@/modules/copilot/domain/copilotIntents";
export { COPILOT_MASTER_DISCLAIMER } from "@/modules/copilot/domain/copilotDisclaimers";
export type {
  CopilotResponse,
  CopilotResult,
  CopilotError,
  CopilotActionItem,
  CopilotActionPlan,
} from "@/modules/copilot/domain/copilotTypes";
export {
  detectIntent,
  detectIntentAsync,
  detectIntentKeywordOnly,
  detectIntentWithOptionalLlm,
} from "@/modules/copilot/infrastructure/intentDetectionService";
export { buildCopilotResponse, maybeEnrichResponseWithSummary } from "@/modules/copilot/infrastructure/responseBuilder";
export { summarizeCopilotResult } from "@/modules/copilot/infrastructure/openaiSummarizer";
export { retrieveCopilotMemoryForContext } from "@/modules/copilot/infrastructure/memoryRetrievalService";
export { copilotPostBodySchema } from "@/modules/copilot/api/copilotSchemas";
export { CopilotPanel } from "@/modules/copilot/ui/CopilotPanel";
export { CopilotFloatingDock } from "@/modules/copilot/ui/CopilotFloatingDock";
export { CopilotInput } from "@/modules/copilot/ui/CopilotInput";
export { CopilotResponseView } from "@/modules/copilot/ui/CopilotResponse";
