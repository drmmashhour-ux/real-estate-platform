/**
 * Daily Growth Brief — read-only rollup (advisory). No mutations.
 */

export type GrowthDailyBriefStatus = "weak" | "watch" | "healthy" | "strong";

export type GrowthDailyBrief = {
  date: string;
  yesterday: {
    leads: number;
    campaignsActive: number;
    topCampaign?: string;
    conversionsStarted?: number;
  };
  today: {
    priorities: string[];
    focus?: string;
  };
  blockers: string[];
  notes: string[];
  status: GrowthDailyBriefStatus;
  createdAt: string;
};
