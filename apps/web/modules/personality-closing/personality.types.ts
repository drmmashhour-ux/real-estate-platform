import type { PsychologySuggestionBundle } from "@/modules/sales-psychology/psychology.types";

/** DISC-style sales personalities — observable communication preference, not a clinical profile. */
export type ClientPersonalityType = "DRIVER" | "ANALYTICAL" | "EXPRESSIVE" | "AMIABLE";

export type PersonalityDetectionResult = {
  primary: ClientPersonalityType;
  confidence: number;
  rationale: string[];
};

export type PersonalityStrategy = {
  title: string;
  bullets: string[];
};

/** Merged psychology + personality coaching for live calls — structured adaptation, not manipulation. */
export type ClosingCoachBundle = PsychologySuggestionBundle & {
  personality: PersonalityDetectionResult;
  personalityStrategy: PersonalityStrategy;
  /** Single line to read on the call */
  recommendedTone: string;
  /** Psychology example rewritten for this personality when helpful */
  adaptedExampleSentence: string;
  /** Union of psychology avoid-list + personality-specific pitfalls */
  avoidCombined: string[];
  personalityIndicator: string;
};

export type PersonalityLearningAgg = {
  outcomes: Partial<
    Record<ClientPersonalityType, { tries: number; wins: number }>
  >;
  /** personality -> best strategyKey by wins/tries heuristic */
  strategyHits: Partial<Record<ClientPersonalityType, Record<string, { tries: number; wins: number }>>>;
};
