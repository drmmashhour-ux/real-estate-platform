import type { SalesScriptCategory } from "@/modules/sales-scripts/sales-script.types";

/**
 * Live personas — DISC-aligned closing practice + legacy pressure modes.
 * Primary roster: driver_broker, analytical_investor, expressive_user, amiable_client.
 */
export type LivePersonaType =
  | "driver_broker"
  | "analytical_investor"
  | "expressive_user"
  | "amiable_client"
  | "aggressive_broker"
  | "skeptical_broker"
  | "dominant_investor";

export type ChatRole = "persona" | "user";

export type LiveChatTurn = {
  role: ChatRole;
  text: string;
  atMs: number;
  /** Inline feedback stored on user turns */
  feedback?: LiveFeedbackResult;
};

export type FeedbackTag =
  | "too_long"
  | "weak_close"
  | "no_control"
  | "good_framing"
  | "strong_close"
  | "unclear_value"
  | "asks_question";

export type LiveFeedbackResult = {
  score: number;
  tags: FeedbackTag[];
  quickFix: string;
  betterVersion?: string;
};

export type LiveSessionConfig = {
  personaType: LivePersonaType;
  /** Seconds allowed per reply before pressure kicks in */
  secondsPerTurn: number;
  /** 0–1 probability boost for interrupts under pressure */
  interruptIntensity: number;
  maxTurns: number;
};

export type LiveSessionState = {
  sessionId: string;
  config: LiveSessionConfig;
  /** Escalates when replies score low or objections stack */
  tension: number;
  objectionStack: number;
  turn: number;
  messages: LiveChatTurn[];
  ended: boolean;
  outcome?: "won" | "lost" | "timeout" | "neutral";
  /** Last persona line may be flagged as interrupt */
  lastInterrupt: boolean;
  /** Structured scenario lab — see training-scenarios module */
  scenarioId?: string;
  /** Next index into scenario.objections for progressive injection */
  scenarioObjectionIndex?: number;
};

export type LiveStepResult = {
  state: LiveSessionState;
  feedback: LiveFeedbackResult;
  /** Extra persona line fired before normal reply (interrupt) */
  interruptLine?: string;
};

export type SessionSummary = {
  sessionId: string;
  personaType: LivePersonaType;
  /** When set, session used structured scenario definitions */
  scenarioId?: string;
  endedAtIso: string;
  averageScore: number;
  totalScore: number;
  turnsGraded: number;
  strengths: string[];
  weaknesses: string[];
  topMistakes: string[];
  bestLines: string[];
};

export type StoredSessionRecord = {
  summary: SessionSummary;
  savedAtIso: string;
};

export type AggregateProgress = {
  sessionCount: number;
  rollingAverageScore: number;
  lastPersona: LivePersonaType | null;
};
