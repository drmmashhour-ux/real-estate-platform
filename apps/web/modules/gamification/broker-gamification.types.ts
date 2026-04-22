/** Broker gamification — categories, scopes, levels */

export const POINT_CATEGORIES = [
  "ONBOARDING",
  "TRANSACTION",
  "SPEED",
  "QUALITY",
  "COMPLIANCE",
  "LEADS",
] as const;
export type PointCategory = (typeof POINT_CATEGORIES)[number];

export const STREAK_TYPES = ["ACTIVE_DAYS", "FAST_RESPONSE", "DOC_COMPLETION"] as const;
export type StreakType = (typeof STREAK_TYPES)[number];

export const BADGE_CODES = [
  "FIRST_DEAL",
  "FAST_RESPONDER",
  "COMPLIANCE_STAR",
  "DOCUMENT_PRO",
  "TOP_CONVERTER",
  "TRUSTED_BROKER",
  "STREAK_7",
  "STREAK_30",
] as const;
export type BadgeCode = (typeof BADGE_CODES)[number];

export const BROKER_LEVELS = ["STARTER", "ACTIVE", "PRO", "ELITE", "PLATINUM"] as const;
export type BrokerLevelId = (typeof BROKER_LEVELS)[number];

export type LeaderboardScope = "GLOBAL" | "CITY" | "AGENCY";
export type LeaderboardWindow = "WEEKLY" | "MONTHLY" | "ALL_TIME";

export type LeaderboardRow = {
  rank: number;
  brokerId: string;
  displayName: string | null;
  city: string | null;
  agencyKey: string | null;
  rawPoints: number;
  normalizedScore: number;
  level: BrokerLevelId;
  badgeCount: number;
};

export type GamificationMePayload = {
  brokerId: string;
  totalPoints: number;
  effectivePoints: number;
  level: BrokerLevelId;
  complianceQuality: number;
  streaks: { type: StreakType; count: number }[];
  badgesEarned: number;
  badgesLockedHints: string[];
  rewardsAvailable: number;
  leaderboardPreview: LeaderboardRow[];
  myRankGlobal?: number;
};
