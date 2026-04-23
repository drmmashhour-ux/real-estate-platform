import type { SalesScriptCategory, ScriptAudience, ScriptContext } from "@/modules/sales-scripts/sales-script.types";

import type { CallStage } from "@/modules/call-assistant/call-assistant.types";

/** Basic speaker labeling — browser mic is mono; user can tag lines for CRM clarity. */
export type SpeakerLabel = "rep" | "counterpart" | "unknown";

export type TranscriptChunk = {
  id: string;
  atMs: number;
  text: string;
  speaker: SpeakerLabel;
  /** True when recognition finalized an utterance (vs interim). */
  final: boolean;
};

export type TranscriptionCallbacks = {
  onPartial?: (chunk: TranscriptChunk) => void;
  onFinal?: (chunk: TranscriptChunk) => void;
  onError?: (message: string) => void;
};

export type TranscriptionSession = {
  /** Stop recognition and release listeners (does not stop MediaStream tracks). */
  stop: () => void;
};

export type CallIntelSuggestionInput = {
  /** Last utterance attributed to the prospect — drives objection detection. */
  lastClientSentence: string;
  audience: ScriptAudience;
  scriptCategory: SalesScriptCategory;
  stage: CallStage;
  discoveryIndex?: number;
  scriptContext?: ScriptContext;
};

export type CallIntelAnalysis = {
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  objectionsDetected: string[];
  keyPhrases: string[];
  /** Heuristic 0–1 from keywords + objections (not a prediction guarantee). */
  conversionLikelihood: number;
};

export type RecordingConsent = "none" | "pending" | "granted" | "denied";

export type ManualRecordingState = "idle" | "recording" | "stopped";

export type CallIntelSessionMetrics = {
  startedAtIso: string;
  endedAtIso?: string;
  secondsApprox: number;
  transcriptCharCount: number;
  recordingByteLength?: number;
};
