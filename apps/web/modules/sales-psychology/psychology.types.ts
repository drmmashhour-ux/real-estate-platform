/** Observable posture in conversation — deterministic rules, not clinical diagnosis. */
export type ClientPsychologicalState =
  | "skeptical"
  | "defensive"
  | "curious"
  | "interested"
  | "dominant"
  | "disengaged";

/** Buyer journey framing for response choice. */
export type DecisionStage = "unaware" | "exploring" | "comparing" | "ready_to_decide" | "rejecting";

export type PsychologySignals = Partial<Record<ClientPsychologicalState | "tone_short", number>>;

export type PsychologyDetectionResult = {
  /** Primary inferred state */
  primaryState: ClientPsychologicalState;
  /** Secondary hint if strong */
  secondaryState?: ClientPsychologicalState;
  confidence: number;
  signals: PsychologySignals;
  stage: DecisionStage;
  rationale: string[];
};

export type PsychologyStrategy = {
  /** Short headline for reps */
  title: string;
  bullets: string[];
};

export type PsychologySuggestionBundle = {
  detection: PsychologyDetectionResult;
  strategyKey: string;
  strategy: PsychologyStrategy;
  /** Tone and structure guidance */
  responseStyle: string;
  /** Ready-to-read line — factual, bounded, respectful */
  exampleSentence: string;
  /** Patterns to avoid (ethical guardrails + weak persuasion) */
  avoidPhrases: string[];
  /** Emoji label for dashboards */
  indicator: string;
};

export type PostCallPsychologyAnalysis = {
  dominantState: ClientPsychologicalState;
  dominantStage: DecisionStage;
  mistakesObserved: string[];
  missedOpportunities: string[];
  betterApproach: string[];
};

export type StrategyPerformanceRow = {
  strategyKey: string;
  impressions: number;
  positiveOutcomes: number;
};
