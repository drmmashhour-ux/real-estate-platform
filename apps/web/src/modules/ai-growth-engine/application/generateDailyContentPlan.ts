import { randomUUID } from "crypto";
import { COMPLIANCE_FOOTER_LECIPM } from "@/src/modules/ai-growth-engine/domain/growth.policies";
import type { DailyContentPlan, DailyContentPlanSlot, GrowthPlatform } from "@/src/modules/ai-growth-engine/domain/growth.types";
import { growthJsonCompletion } from "@/src/modules/ai-growth-engine/infrastructure/growthLlm";

type LlmPlan = {
  brandVoice: string;
  slots: DailyContentPlanSlot[];
};

const SYSTEM = `You are a restrained marketing planner for a Quebec-focused real estate platform (LECIPM).
Output valid JSON only. Use simple language. No spammy superlatives. No guaranteed returns. Include educational disclaimer awareness.
Slots should be 3–5 items covering mixed formats (short post, video script idea, blog, email). Hooks must be factual and curiosity-based, not deceptive.`;

export async function generateDailyContentPlan(args: {
  planDate: string;
  focus?: string;
}): Promise<DailyContentPlan> {
  const user = `Plan date: ${args.planDate}. Optional focus: ${args.focus ?? "general seller education and trust"}. 
  Return JSON: { "brandVoice": string, "slots": Array<{ "topic": string, "contentType": "video_script"|"short_post"|"blog"|"email", "platforms": string[], "hooks": string[], "notes"?: string }> }`;

  const parsed = await growthJsonCompletion<LlmPlan>({ system: SYSTEM, user, label: "daily_plan" });

  if (!parsed.ok) {
    return fallbackPlan(args.planDate);
  }

  const slots = (parsed.data.slots ?? []).slice(0, 5).map((s) => ({
    ...s,
    contentType: normalizeKind(s.contentType),
    platforms: normalizePlatforms(s.platforms),
  }));

  return {
    id: randomUUID(),
    planDate: args.planDate,
    brandVoice: parsed.data.brandVoice ?? "Clear, calm, Quebec-market aware.",
    slots: slots.length ? slots : fallbackPlan(args.planDate).slots,
    complianceFooter: COMPLIANCE_FOOTER_LECIPM,
  };
}

function normalizeKind(k: string): DailyContentPlanSlot["contentType"] {
  if (k === "video_script" || k === "short_post" || k === "blog" || k === "email") return k;
  return "short_post";
}

function normalizePlatforms(p: string[]): GrowthPlatform[] {
  const allowed = new Set<GrowthPlatform>(["tiktok", "youtube", "instagram", "linkedin", "blog", "email", "x"]);
  const out = (p ?? []).filter((x): x is GrowthPlatform => allowed.has(x as GrowthPlatform));
  return out.length ? out : ["linkedin"];
}

function fallbackPlan(planDate: string): DailyContentPlan {
  return {
    id: randomUUID(),
    planDate,
    brandVoice: "Practical, non-hype guidance for sellers and buyers in Quebec.",
    complianceFooter: COMPLIANCE_FOOTER_LECIPM,
    slots: [
      {
        topic: "Reading a listing: what to verify before visiting",
        contentType: "short_post",
        platforms: ["linkedin", "x"],
        hooks: ["Three checks that save time before a showing."],
      },
      {
        topic: "Deposit basics (overview)",
        contentType: "video_script",
        platforms: ["youtube", "tiktok"],
        hooks: ["What “deposit” usually means in an offer—overview only."],
      },
      {
        topic: "Seller prep checklist",
        contentType: "blog",
        platforms: ["blog"],
        hooks: ["A calm checklist—not legal advice."],
      },
    ],
  };
}
