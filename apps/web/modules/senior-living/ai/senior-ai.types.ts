/** Maximum-AI vertical — shared types (no raw model dumps to clients). */

export type FitLabel = "STRONG" | "GOOD" | "POSSIBLE" | "WEAK";

export type SeniorAiProfileInput = {
  sessionId?: string | null;
  userId?: string | null;
  whoFor?: string | null;
  ageBand?: string | null;
  mobilityLevel?: string | null;
  careNeedLevel?: string | null;
  memorySupportNeeded?: boolean;
  medicalSupportNeeded?: boolean;
  mealSupportNeeded?: boolean;
  socialActivityPriority?: boolean;
  budgetBand?: string | null;
  preferredCity?: string | null;
  preferredArea?: string | null;
  languagePreference?: string | null;
  urgencyLevel?: string | null;
  /** Monthly budget midpoint when known */
  budgetMonthly?: number | null;
};

export type MatchingEngineComponentScores = {
  careMatch: number;
  budgetMatch: number;
  locationMatch: number;
  servicesMatch: number;
  availabilitySignal: number;
  languageComfort: number;
  urgencyFit: number;
};

export type MatchingEngineRow = {
  residenceId: string;
  baseScore: number;
  componentScores: MatchingEngineComponentScores;
  fitLabel: FitLabel;
  warnings: string[];
};

export type UiExplanationPack = {
  headline: string;
  bullets: string[];
};

export type ConversionPrediction = {
  visitProbability: number;
  contractProbability: number;
  priorityLabel: "HIGH" | "MEDIUM" | "LOW";
  nextBestAction: string;
};

export type OperatorPerfSignals = {
  responseTimeAvgHours?: number | null;
  leadAcceptanceRate?: number | null;
  visitRate?: number | null;
  conversionRate?: number | null;
  profileCompleteness?: number | null;
  trustScore?: number | null;
  coldStart?: boolean;
};

export type VoiceParseResult = {
  preferredCity: string | null;
  budgetMonthly: number | null;
  whoFor: string | null;
  careNeedLevel: string | null;
  urgencyLevel: string | null;
  confidence: number;
};
