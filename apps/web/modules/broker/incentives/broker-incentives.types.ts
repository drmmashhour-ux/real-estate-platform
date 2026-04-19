/**
 * Broker incentives — recognition only; no payouts or financial promises.
 */

export type BrokerBadgeCategory = "activity" | "followup" | "conversion" | "discipline";

export type BrokerBadgeLevel = "bronze" | "silver" | "gold";

export type BrokerBadge = {
  id: string;
  label: string;
  description: string;
  category: BrokerBadgeCategory;
  level?: BrokerBadgeLevel;
  unlockedAt?: string;
};

export type BrokerStreakType = "followup" | "response" | "activity";

export type BrokerStreak = {
  type: BrokerStreakType;
  currentCount: number;
  bestCount: number;
  lastUpdatedAt: string;
};

export type BrokerMilestone = {
  id: string;
  label: string;
  description: string;
  achieved: boolean;
  achievedAt?: string;
};

export type BrokerIncentiveSummary = {
  brokerId: string;
  badges: BrokerBadge[];
  streaks: BrokerStreak[];
  milestones: BrokerMilestone[];
  highlights: string[];
  nextTargets: string[];
};
