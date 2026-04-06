export const FUNDRAISING_STAGES = [
  "contacted",
  "interested",
  "meeting",
  "negotiating",
  "closed",
] as const;

export type FundraisingStage = (typeof FUNDRAISING_STAGES)[number];

export const FUNDRAISING_INTERACTION_TYPES = [
  "email",
  "call",
  "meeting",
  "outreach",
  "response",
  "follow_up",
] as const;

export type FundraisingInteractionType = (typeof FUNDRAISING_INTERACTION_TYPES)[number];

export const FUNDRAISING_DEAL_STATUSES = ["open", "committed", "closed"] as const;

export type FundraisingDealStatus = (typeof FUNDRAISING_DEAL_STATUSES)[number];

export function isFundraisingStage(s: string): s is FundraisingStage {
  return (FUNDRAISING_STAGES as readonly string[]).includes(s);
}

export function isFundraisingDealStatus(s: string): s is FundraisingDealStatus {
  return (FUNDRAISING_DEAL_STATUSES as readonly string[]).includes(s);
}

export const FUNDRAISING_ROUND_STATUSES = ["open", "closed"] as const;

export type FundraisingRoundStatus = (typeof FUNDRAISING_ROUND_STATUSES)[number];

export const INVESTOR_COMMITMENT_STATUSES = ["interested", "committed", "transferred"] as const;

export type InvestorCommitmentStatus = (typeof INVESTOR_COMMITMENT_STATUSES)[number];

export function isFundraisingRoundStatus(s: string): s is FundraisingRoundStatus {
  return (FUNDRAISING_ROUND_STATUSES as readonly string[]).includes(s);
}

export function isInvestorCommitmentStatus(s: string): s is InvestorCommitmentStatus {
  return (INVESTOR_COMMITMENT_STATUSES as readonly string[]).includes(s);
}
