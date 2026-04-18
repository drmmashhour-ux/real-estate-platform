export type BrokerCompetitionTier = "standard" | "preferred" | "elite";

export type BrokerCompetitionProfile = {
  brokerId: string;
  responseTimeScore: number;
  /** 0–1 proxy from monetization repeat signals (not a legal “close rate” guarantee). */
  closeRate: number;
  activityScore: number;
  tier: BrokerCompetitionTier;
};
