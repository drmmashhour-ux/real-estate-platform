import type { ConversationAiEngineResult } from "@/modules/messaging/analysis/conversation-ai.engine";

/**
 * In-app call session model. Recording/transcripts require explicit consent; no auto decisions.
 * Ready for later Twilio / WebRTC wiring without a hard provider dependency.
 */

export type CallSessionStatus = "active" | "ended";

export type CallSessionMetadata = {
  /** Set only when recording was explicitly consented to (e.g. provider or local consent flag). */
  recordingUrl?: string;
  /** True when a transcript (manual or provider) is attached. */
  transcriptAvailable?: boolean;
  /** True when the broker confirmed consent to process/store a transcript (Law 25–aligned product practice). */
  transcriptProcessingConsent?: boolean;
  /** True when the broker consented to recording, if a provider is used. */
  recordingConsent?: boolean;
};

export type CallSession = {
  id: string;
  conversationId: string;
  brokerId: string;
  clientId: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  status: CallSessionStatus;
  metadata: CallSessionMetadata;
};

export type CallEventType = "speech_segment" | "silence" | "interruption" | "long_pause";

/**
 * Real-time, timing-only client/provider events. No recording implied.
 * Optional `speaker` helps light balance/engagement heuristics when the bridge supplies it.
 */
export type CallEvent = {
  timestamp: string;
  type: CallEventType;
  speaker?: "broker" | "client";
  /** For speech or silence, optional duration. */
  durationMs?: number;
};

export type PostCallExtractedPreferences = {
  budgetLabel?: string | null;
  preferredArea?: string | null;
  propertyType?: string | null;
  financingSignals: string[];
  urgencyHint: "low" | "medium" | "high" | null;
};

import type { ConversationAiEngineResult } from "@/modules/messaging/analysis/conversation-ai.engine";

/**
 * Heuristic call review — not legal, financial, or personal advice. Coach-only output.
 * Structured like messaging AI; summary/keyPoints are human-readable, explainable.
 */
export type PostCallAnalysisResult = {
  summary: string;
  keyPoints: string[];
  objections: ConversationAiEngineResult["objections"];
  dealStage: ConversationAiEngineResult["dealStage"];
  riskHeatmap: ConversationAiEngineResult["riskHeatmap"];
  closingReadiness: ConversationAiEngineResult["closingReadiness"];
  /** Cross-cutting coaching lines (messaging engine). */
  coaching: ConversationAiEngineResult["coaching"];
  extractedPreferences: PostCallExtractedPreferences;
  /** Soft signals; use your own review before relying on in CRM. */
  sentiment: ConversationAiEngineResult["sentiment"];
  dealPrediction: ConversationAiEngineResult["dealPrediction"];
};
