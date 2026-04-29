export type HostReputationTier = "starter" | "growth" | "established" | "elite";

export type HostReputationResult = {
  tier: HostReputationTier;
  score: number;
  limitedHistory: boolean;
  reasons: string[];
  improvementSuggestions: string[];
};
