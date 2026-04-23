/**
 * Cross-module hooks for marketing workflows (calendar + engine + growth).
 * These are side-effect free except where they call `createContentItem` (see `applyDailyPlanToContentCalendar` in daily service).
 */

import type { WeeklyPlan } from "@/modules/marketing-ai/marketing-ai.types";
import { saveWeeklyPlan, loadMarketingAiStore, generateWeeklyPlan } from "@/modules/marketing-ai";
import { generateDailyContentPlan, applyDailyPlanToContentCalendar } from "./ai-content-daily.service";
import { generateContentIdeas } from "./ai-content-ideas.service";
import { generateShortFormScript } from "./ai-content-script.service";
import { generateCaptionPack } from "./ai-content-caption.service";
import { scriptToPlainText } from "./ai-content-script.service";
import { packToSocialText } from "./ai-content-caption.service";

type MergeHint = { calendarItemsCreated: number; weeklyPlanPatched: boolean; note: string };

/**
 * 1) Push today’s 1–3 items into the **Content Calendar** as IDEA.
 * 2) If no weekly plan exists in the Marketing AI store, create a **light** week plan shell (copy slots optional).
 */
export function mergeAiContentWithMarketingStack(input: { city: string; weekStart?: Date }): MergeHint {
  const plan = generateDailyContentPlan({ city: input.city, postsPerDay: 3, anchorDate: new Date() });
  const cal = applyDailyPlanToContentCalendar(plan);

  const store = loadMarketingAiStore();
  let weeklyPlanPatched = false;
  if (!store.weeklyPlan) {
    const w = input.weekStart ?? new Date();
    const shell: WeeklyPlan = generateWeeklyPlan(w, { slotsTotal: 5, dryCopy: false });
    saveWeeklyPlan(shell);
    weeklyPlanPatched = true;
  }

  return {
    calendarItemsCreated: cal.length,
    weeklyPlanPatched,
    note:
      "Daily ideas are in the Content Calendar. Autonomous engine can approve/queue; Growth Brain: review signals on /dashboard/admin/growth-brain.",
  };
}

/**
 * Build prompt-ready summaries for the **Autonomous Marketing Engine** (no queue writes).
 */
export function buildAutonomyEngineContextSnapshot(city: string) {
  const ideas = generateContentIdeas(city, 5);
  return ideas.map((idea) => {
    const s = generateShortFormScript(idea, "INSTAGRAM");
    const c = generateCaptionPack(idea, "INSTAGRAM", s);
    return {
      idea: idea.title,
      scriptPreview: scriptToPlainText(s).slice(0, 400),
      captionPreview: packToSocialText(c).slice(0, 400),
    };
  });
}

/**
 * Suggested “signals” line for **Growth Brain** (human-readable; not a data dependency).
 */
export function growthBrainCrossSellLine(): string {
  return "When city-level intent spikes, route short-form ideas from the AI Content Generator to the calendar first, then to paid amplification.";
}
