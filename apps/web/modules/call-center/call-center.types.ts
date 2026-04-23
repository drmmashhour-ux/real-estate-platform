import type { SalesScriptCategory } from "@/modules/sales-scripts/sales-script.types";

export type AudienceKind = "BROKER" | "INVESTOR";

/** Broker / investor simulator archetypes — difficulty scales with training level. */
export type SimulationPersonaId =
  | "broker_busy"
  | "broker_skeptical"
  | "broker_aggressive"
  | "broker_high_performer"
  | "investor_curious"
  | "investor_skeptical"
  | "investor_dominant"
  | "investor_analytical";

export type TrainingLevel = "beginner" | "intermediate" | "advanced" | "elite";

export type PersonaProfile = {
  id: SimulationPersonaId;
  audience: AudienceKind;
  title: string;
  traits: string[];
  /** 1–4 — higher unlocks at advanced levels */
  difficulty: number;
  /** Script category used to score replies against approved lines */
  scriptCategory: SalesScriptCategory;
};

export type SimulationStartResult = {
  persona: PersonaProfile;
  /** First line from the simulated client */
  firstClientMessage: string;
  /** High-level beats for the coach UI */
  flowOutline: string[];
  suggestedStage: import("@/modules/call-assistant/call-assistant.types").CallStage;
};

export type SimulationTurnState = {
  personaId: SimulationPersonaId;
  turnIndex: number;
  /** Rolled transcript of client lines */
  clientMessages: string[];
  /** User replies in order */
  userReplies: string[];
  ended: boolean;
  outcome?: "won" | "lost" | "neutral";
};

export type SimulationStepResult = {
  state: SimulationTurnState;
  /** Next simulated client message (empty if ended) */
  nextClientMessage: string;
  ended: boolean;
};

export type TrainingFeedbackResult = {
  overallScore: number;
  clarityScore: number;
  confidenceScore: number;
  controlScore: number;
  strengths: string[];
  improvements: string[];
  /** Rewritten line using approved script voice when possible */
  betterVersion?: string;
};

export type LiveAssistInput = {
  transcript: string;
  lastClientSentence: string;
  audience: AudienceKind;
  scriptCategory: SalesScriptCategory;
  stage: import("@/modules/call-assistant/call-assistant.types").CallStage;
  discoveryIndex?: number;
};

export type CallPerformanceVm = {
  callsLogged: number;
  demosBooked: number;
  conversionRate: number;
  topObjections: { label: string; count: number }[];
  sinceDays: number;
};

export type TrainingGamificationVm = {
  /** Running average of last N session scores (client may persist). */
  averageScore: number;
  streak: number;
  level: TrainingLevel;
  xpTowardNext: number;
};
