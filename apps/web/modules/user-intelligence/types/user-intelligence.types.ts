/**
 * Product-relevant preference and journey data only. No protected-trait or identity-inference storage.
 */
export type UserPreferenceSignalInput = {
  userId: string;
  sourceDomain: string;
  sourceType: string;
  sourceId?: string;
  profileId?: string;
  signalKey: string;
  signalValue: unknown;
  signalWeight?: number;
  confidence?: number;
  explicitUserProvided?: boolean;
  derivedFromBehavior?: boolean;
  expiresAt?: Date;
  lastObservedAt?: Date;
};

export type UserProfileBuildInput = {
  userId: string;
  /**
   * Session always wins: merge explicit answers from the current request first.
   */
  sessionExplicitOverride?: Record<string, unknown> | null;
  trigger: "dream_home" | "rebuild" | "signal_rollup" | "import";
};

export type UserPreferenceProfileView = {
  id: string;
  userId: string;
  confidenceScore: number | null;
  lastInteractionAt: string | null;
  lastRebuiltAt: string | null;
  isActive: boolean;
  categories: {
    household?: Record<string, unknown> | null;
    housing?: Record<string, unknown> | null;
    lifestyle?: Record<string, unknown> | null;
    neighborhood?: Record<string, unknown> | null;
    budget?: Record<string, unknown> | null;
    accessibility?: Record<string, unknown> | null;
    design?: Record<string, unknown> | null;
  };
  sourceSignalCount: number;
};

export type UserJourneyUpdateInput = {
  userId: string;
  currentIntent?: string;
  currentDomain?: string;
  currentStage?: string;
  currentSearchMode?: string;
  latestCity?: string;
  latestBudgetBand?: string;
  latestPropertyIntent?: string;
  latestHouseholdBand?: string;
  summaryJson?: Record<string, unknown> | null;
  touchActivityAt?: boolean;
};

export type UserPersonalizationContext = {
  userId: string;
  hasProfile: boolean;
  confidence: number;
  /**
   * Safe, structured hints for scoring / recs. Session explicit keys must override at merge time.
   */
  signals: Record<string, string | number | boolean | null>;
  journey?: {
    currentDomain?: string | null;
    currentStage?: string | null;
    latestCity?: string | null;
  };
  housingPreferences: Record<string, unknown> | null;
  designPreferences: Record<string, unknown> | null;
  budgetPreferences: Record<string, unknown> | null;
  usedWave13Profile: boolean;
};

export type UserPreferenceMergeResult = {
  householdProfile: Record<string, unknown> | null;
  housingPreferences: Record<string, unknown> | null;
  lifestylePreferences: Record<string, unknown> | null;
  neighborhoodPreferences: Record<string, unknown> | null;
  budgetPreferences: Record<string, unknown> | null;
  accessibilityPreferences: Record<string, unknown> | null;
  designPreferences: Record<string, unknown> | null;
  confidence: number;
};

export type UserIntelligenceServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };
