import type { MarketingAutonomyLevel, WeeklyPlan } from "./marketing-ai.types";
import { loadMarketingAiStore, saveMarketingAiStore } from "./marketing-ai-storage";

export function getAutonomyLevel(): MarketingAutonomyLevel {
  return loadMarketingAiStore().autonomyLevel;
}

export function setAutonomyLevel(level: MarketingAutonomyLevel): void {
  const s = loadMarketingAiStore();
  s.autonomyLevel = level;
  saveMarketingAiStore(s);
}

export function saveWeeklyPlan(plan: WeeklyPlan | null): void {
  const s = loadMarketingAiStore();
  s.weeklyPlan = plan;
  saveMarketingAiStore(s);
}

export function getWeeklyPlan(): WeeklyPlan | null {
  return loadMarketingAiStore().weeklyPlan;
}
