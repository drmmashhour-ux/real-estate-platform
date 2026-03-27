/**
 * Platform AI core — client, prompts, guardrails, audit logging, fallbacks.
 * Hub-specific behavior lives in `../buyer`, `../seller`, `../bnhub`, etc.
 */

export type { AiHub, AiIntent, AiMessages, RunAiTaskParams, RunAiTaskResult } from "./types";
export {
  runAiTask,
  generateSuggestion,
  generateSummary,
  generateDraft,
  explainSection,
  analyzeData,
  detectRisk,
} from "./ai-client";
export { AI_LEGAL_FINANCIAL_NOTICE, appendStandardNotice, sanitizeContext, summarizeForAudit } from "./ai-guardrails";
export { intentPreamble, hubVoice, buildBaseSystem } from "./ai-prompts";
export { buildMessagesForHub, offlineTextForHub } from "./hub-router";
export { persistAiInteractionLog } from "./ai-audit-log";
export {
  AI_SIGN_IN_REQUIRED,
  AI_RATE_LIMITED,
  AI_PROVIDER_UNAVAILABLE,
  AI_CRITICAL_ACTION_NOTICE,
  messageFromAiApiError,
} from "./ai-fallbacks";
