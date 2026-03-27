import type { GrowthMarketingPlatform } from "@prisma/client";
import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";
import type { WeeklyCampaignPlan } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { selectContentAngle } from "@/src/modules/growth-automation/application/selectContentAngle";
import { selectDailyTopic } from "@/src/modules/growth-automation/application/selectDailyTopic";

const PLATFORMS: GrowthMarketingPlatform[] = ["LINKEDIN", "INSTAGRAM", "BLOG", "EMAIL"];

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function fallbackWeek(weekStart: string): WeeklyCampaignPlan {
  const theme = "Trust-first deal discipline";
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const { topic } = selectDailyTopic({ planDate: date });
    return {
      date,
      mainTopic: topic,
      angle: selectContentAngle(date, "week"),
      platforms: PLATFORMS,
    };
  });
  return { weekStart, theme, days };
}

export async function generateWeeklyCampaignPlan(args: { weekStart: string; themeHint?: string }): Promise<WeeklyCampaignPlan> {
  const res = await growthAutomationJsonCompletion<WeeklyCampaignPlan>({
    system:
      "You plan a week of LECIPM marketing content (Quebec real estate legal-tech). JSON only. No hype, no spam.",
    user: `Week starting (ISO date): ${args.weekStart}. Theme hint: ${args.themeHint ?? "none"}.
Return JSON: { "weekStart", "theme", "days": [ { "date", "mainTopic", "angle", "platforms": string[] } ] } — 7 days.`,
    label: "weekly_plan",
  });
  if (!res.ok) return fallbackWeek(args.weekStart);
  const d = res.data;
  if (!d.days?.length) return fallbackWeek(args.weekStart);
  return d;
}
