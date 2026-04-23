import type {
  AutoVideoAudience,
  AutoVideoGoal,
} from "../auto-video/auto-video.types";

export type MarketingWeekPlanConfig = {
  city: string;
  focusAreas: string[];
  audiences: AutoVideoAudience[];
  goals: AutoVideoGoal[];
};

export type WeeklyContentItem = {
  id: string;
  day: number; // 1-7
  time: string; // e.g. "11:00"
  platform: "TIKTOK" | "INSTAGRAM" | "FACEBOOK" | "LINKEDIN" | "YOUTUBE_SHORTS";
  type: "VIDEO" | "POSTER" | "STORY";
  title: string;
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
  cta: string;
  city: string;
  area: string;
  audience: AutoVideoAudience;
  goal: AutoVideoGoal;
  status: "READY_FOR_APPROVAL";
  videoRequestId?: string;
};

export type WeeklyContentPlan = {
  id: string;
  config: MarketingWeekPlanConfig;
  items: WeeklyContentItem[];
  generatedAtIso: string;
};
