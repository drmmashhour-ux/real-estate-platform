import type { DailyActionStats } from "./growth-daily-actions.service";
import type { RevenueTargetStatus } from "./revenue-target.service";

export type GrowthTaskItem = {
  id: string;
  label: string;
  done: boolean;
};

/**
 * Daily prioritized tasks toward $1K/month execution rhythm.
 */
export function getDailyGrowthTasks(stats: DailyActionStats): GrowthTaskItem[] {
  return [
    {
      id: "brokers",
      label: "Contact 5 new brokers",
      done: stats.brokersContacted >= 5,
    },
    {
      id: "followups",
      label: "Send follow-ups",
      done: stats.followUpsSent >= 5,
    },
    {
      id: "lead_sale",
      label: "Push 1 lead sale",
      done: stats.leadsSold > 0,
    },
  ];
}

export type GrowthPlanRecommendation = {
  headline: string;
  detail: string;
};

export function getGrowthPlanRecommendation(
  target: RevenueTargetStatus,
  stats: DailyActionStats,
): GrowthPlanRecommendation {
  if (stats.brokersContacted < 5) {
    return {
      headline: "Increase outreach",
      detail: "Operator CRM: log broker touches via close tools so progress shows here — aim for 5+ contacts today.",
    };
  }
  if (stats.followUpsSent < 5) {
    return {
      headline: "Focus on follow-through",
      detail: "Brokers need follow-ups on warm leads — drive 5+ logged follow-ups today.",
    };
  }
  if (stats.leadsSold === 0) {
    return {
      headline: "Focus on closing today",
      detail: "No lead monetization events yet today — prioritize one unlock or paid lead flow.",
    };
  }
  if (target.remaining > 0 && target.progressPercent >= 80) {
    return {
      headline: "Finish the month strong",
      detail: `About $${target.remaining.toFixed(0)} CAD left to clear the $1k bar.`,
    };
  }
  return {
    headline: "Stay on rhythm",
    detail: "Daily actions look on track — keep pipeline visibility and revenue logging consistent.",
  };
}
