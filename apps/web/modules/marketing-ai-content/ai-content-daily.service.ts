import { format } from "date-fns";

import type { ContentAudience, ContentGoal, ContentPlatform, ContentType } from "@/modules/marketing-content/content-calendar.types";
import { createContentItem } from "@/modules/marketing-content/content-calendar.service";

import type {
  AiContentPlatform,
  AiDailyContentPlan,
  AiDailyPost,
  MarketingAiContentIdea,
} from "./ai-content.types";
import { generateContentIdeas } from "./ai-content-ideas.service";
import { generateShortFormScript, scriptToPlainText } from "./ai-content-script.service";
import { generateCaptionPack, packToSocialText } from "./ai-content-caption.service";
import { newAiId } from "./ai-content-ids";

export type DailyPlanOptions = {
  city?: string;
  /** 1–3 posts for the day */
  postsPerDay?: number;
  anchorDate?: Date;
};

const SLOTS: Array<"morning" | "midday" | "evening"> = ["morning", "midday", "evening"];
const PLATFORMS_CYCLE: AiContentPlatform[] = ["INSTAGRAM", "TIKTOK", "YOUTUBE"];

function seed(n: number) {
  return ((n * 17) % 997) / 997;
}

function mapPlatform(p: AiContentPlatform): ContentPlatform {
  return p;
}

function mapType(kind: "video" | "image"): ContentType {
  return kind === "video" ? "VIDEO" : "POSTER";
}

function mapAudience(idea: MarketingAiContentIdea): ContentAudience {
  const t = idea.title.toLowerCase();
  if (/\bbroker|agent|pipeline/i.test(t)) return "BROKER";
  if (/\binvest|cap|rent comp|roi/i.test(t)) return "INVESTOR";
  if (/\bbuyer|first-?time|mortgage/i.test(t)) return "BUYER";
  return "GENERAL";
}

function mapGoal(idea: MarketingAiContentIdea): ContentGoal {
  const t = `${idea.title} ${idea.angle}`.toLowerCase();
  if (/\blead|client|dm|book/i.test(t)) return "LEADS";
  if (/\bchecklist|chart|research/i.test(t)) return "AWARENESS";
  return "CONVERSION";
}

/**
 * 1–3 posts for one day: mix of short video + image/poster concepts, platform-specific copy.
 */
export function generateDailyContentPlan(opts: DailyPlanOptions = {}): AiDailyContentPlan {
  const anchor = opts.anchorDate ?? new Date();
  const city = opts.city?.trim() || "Montréal";
  const n = Math.max(1, Math.min(opts.postsPerDay ?? 3, 3));
  const daySeed = format(anchor, "yyyy-MM-dd").split("-").reduce((a, x) => a + parseInt(x, 10), 0);

  const ideas = generateContentIdeas(city, n, `daily-${daySeed}`);
  const posts: AiDailyPost[] = ideas.map((idea, i) => {
    const kind: "video" | "image" = seed(daySeed + i) > 0.35 ? "video" : "image";
    const platform = PLATFORMS_CYCLE[(daySeed + i) % PLATFORMS_CYCLE.length]!;
    const script = generateShortFormScript(idea, platform);
    const captions = generateCaptionPack(idea, platform, script);
    return {
      id: newAiId("daypost"),
      dateIso: format(anchor, "yyyy-MM-dd"),
      kind,
      platform,
      idea,
      script,
      captions,
      slot: SLOTS[i % SLOTS.length]!,
    };
  });

  return {
    id: newAiId("plan"),
    anchorDate: format(anchor, "yyyy-MM-dd"),
    city,
    posts,
    generatedAtIso: new Date().toISOString(),
  };
}

/**
 * Materialize a daily plan into the Content Calendar as IDEA items (ready for review).
 */
export function applyDailyPlanToContentCalendar(plan: AiDailyContentPlan) {
  const created: ReturnType<typeof createContentItem>[] = [];
  for (const p of plan.posts) {
    const item = createContentItem({
      title: p.idea.title,
      type: mapType(p.kind),
      platform: mapPlatform(p.platform),
      hook: p.script.hook,
      script: scriptToPlainText(p.script),
      caption: packToSocialText(p.captions),
      audience: mapAudience(p.idea),
      goal: mapGoal(p.idea),
      status: "IDEA",
      scheduledDate: p.dateIso,
    });
    created.push(item);
  }
  return created;
}
