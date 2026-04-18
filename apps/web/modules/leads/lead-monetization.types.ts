/**
 * Lead monetization V1 — additive access model (feature-flagged).
 */

export type LeadAccessLevel = "preview" | "partial" | "full";

export type LeadMonetizationState = {
  leadId: string;
  accessLevel: LeadAccessLevel;
  unlocked: boolean;
  unlockPrice: number;
  currency: string;
  viewed: boolean;
  unlockedAt?: string;
};

export type LeadUnlockResult = {
  success: boolean;
  leadId: string;
  unlocked: boolean;
};
