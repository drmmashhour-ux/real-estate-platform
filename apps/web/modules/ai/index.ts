/**
 * Unified platform AI layer — use `@/modules/ai` for hub-scoped assistants and audits.
 * Hub folders: `buyer/`, `seller/`, `bnhub/`, `broker/`, `mortgage/`, `investor/`, `admin/` (+ `rent/`).
 */

export type { AiHub, AiIntent, AiMessages, RunAiTaskParams, RunAiTaskResult } from "./core/types";
export {
  runAiTask,
  generateSuggestion,
  generateSummary,
  generateDraft,
  explainSection,
  analyzeData,
  detectRisk,
} from "./core/ai-client";
export { AI_LEGAL_FINANCIAL_NOTICE, appendStandardNotice, sanitizeContext, summarizeForAudit } from "./core/ai-guardrails";
export { buildMessagesForHub, offlineTextForHub } from "./core/hub-router";
export { persistAiInteractionLog } from "./core/ai-audit-log";
export {
  AI_SIGN_IN_REQUIRED,
  AI_RATE_LIMITED,
  AI_PROVIDER_UNAVAILABLE,
  AI_CRITICAL_ACTION_NOTICE,
  messageFromAiApiError,
} from "./core/ai-fallbacks";
export { intentPreamble, hubVoice, buildBaseSystem } from "./core/ai-prompts";
export { MORTGAGE_AI_LEGAL_NOTICE } from "./mortgage/mortgage-ai";
