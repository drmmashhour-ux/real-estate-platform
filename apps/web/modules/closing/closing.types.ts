import type { ScriptAudience } from "@/modules/sales-scripts/sales-script.types";

import type { CallStage } from "@/modules/call-assistant/call-assistant.types";

/** Universal closer sequence — guide decisions, don’t chase. */
export type ClosingFlowStep =
  | "hook"
  | "value"
  | "question"
  | "align"
  | "micro_close"
  | "final_close";

export type ClosingFlowContext = {
  callStage: CallStage;
  audience: ScriptAudience;
  /** Latest prospect utterance (typed or transcript) */
  lastProspectInput?: string;
  /** Short recent transcript for readiness detection */
  transcriptSnippet?: string;
  /** Manual advance 0–5 inside closer rail (optional) */
  closerStepOverride?: ClosingFlowStep;
};

export type ClosingStepMeta = {
  step: ClosingFlowStep;
  index: number;
  title: string;
  guidance: string;
};

export type UltimateCloserResult = {
  step: ClosingFlowStep;
  stepMeta: ClosingStepMeta;
  /** Primary line for this step + personality */
  mainLine: string;
  alternatives: [string, string];
  avoid: string[];
  personalityLabel: string;
  recommendedTone: string;
  /** 0–100 — higher when rep leads with questions + time boxes */
  controlLevel: number;
  /** Blended psychology + personality confidence */
  confidenceScore: number;
  /** Signal to land calendar / binary close */
  closeNow: boolean;
  closeNowReason?: string;
  mergeNote: string;
};

export type HardObjectionKey = "not_interested" | "no_time" | "already_have_solution" | "send_email";
