import type { GrowthMarketingPlatform } from "@prisma/client";
import { pickPillarForSlot } from "@/src/modules/growth-automation/application/contentRotation";
import { generateStructuredHook } from "@/src/modules/growth-automation/application/hookGenerationEngine";
import { loadTaxonomyRotationContext } from "@/src/modules/growth-automation/application/taxonomyContext";
import { selectContentAngle } from "@/src/modules/growth-automation/application/selectContentAngle";
import { selectDailyTopic } from "@/src/modules/growth-automation/application/selectDailyTopic";
import { growthAutomationJsonCompletion } from "@/src/modules/growth-automation/infrastructure/growthAutomationLlm";
import { pillarToContentFamily } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import type { DailyContentPlan } from "@/src/modules/growth-automation/domain/growth-automation.types";
import { hookPatternForSlotIndex } from "@/src/modules/growth-automation/domain/hookPatterns";

const DEFAULT_PLATFORMS: GrowthMarketingPlatform[] = [
  "LINKEDIN",
  "INSTAGRAM",
  "YOUTUBE",
  "TIKTOK",
  "BLOG",
  "EMAIL",
];

function buildTaxonomySlots(args: {
  mainTopic: string;
  platforms: GrowthMarketingPlatform[];
  lastPillar: import("@/src/modules/growth-automation/domain/contentTaxonomy").ContentPillar | null;
  countsLast7Days: import("@/src/modules/growth-automation/application/contentRotation").PillarCounts;
}): DailyContentPlan["slots"] {
  let prev = args.lastPillar;
  return args.platforms.map((platform, i) => {
    const pillar = pickPillarForSlot({
      platform,
      previousPillar: prev,
      countsLast7Days: args.countsLast7Days,
    });
    prev = pillar;
    const hookPattern = hookPatternForSlotIndex(i);
    const hook = generateStructuredHook({
      pattern: hookPattern,
      pillar,
      platform,
      topicLine: args.mainTopic,
    });
    return {
      platform,
      hook,
      contentFamily: pillarToContentFamily(pillar),
      taxonomyPillar: pillar,
      hookPattern,
    };
  });
}

function fallbackPlan(planDate: string, focus?: string): DailyContentPlan {
  const { topic } = selectDailyTopic({ planDate, focus });
  const angle = selectContentAngle(planDate);
  return {
    planDate,
    mainTopic: topic,
    contentAngle: angle,
    targetPlatforms: DEFAULT_PLATFORMS,
    cta: "Book a LECIPM workspace walkthrough — see negotiation and documents in one place.",
    linkedProductOrFeature: "Negotiation chain + legal workflow",
    linkedUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      : undefined,
    slots: [],
  };
}

export async function generateDailyContentPlan(args: { planDate: string; focus?: string }): Promise<DailyContentPlan> {
  const planDay = new Date(`${args.planDate}T12:00:00.000Z`);
  const since = new Date(planDay);
  since.setUTCDate(since.getUTCDate() - 7);

  const { countsLast7Days, lastPillar } = await loadTaxonomyRotationContext(since);
  const { topic: mainTopicBase, family } = selectDailyTopic({ planDate: args.planDate, focus: args.focus });
  const contentAngle = selectContentAngle(args.planDate);

  const baseSlots = buildTaxonomySlots({
    mainTopic: mainTopicBase,
    platforms: DEFAULT_PLATFORMS,
    lastPillar,
    countsLast7Days,
  });

  const basePlan: DailyContentPlan = {
    planDate: args.planDate,
    mainTopic: mainTopicBase,
    contentAngle,
    targetPlatforms: DEFAULT_PLATFORMS,
    cta: "Book a LECIPM workspace walkthrough — see negotiation and documents in one place.",
    linkedProductOrFeature: "Negotiation chain + legal workflow",
    linkedUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      : undefined,
    slots: baseSlots,
  };

  const res = await growthAutomationJsonCompletion<{
    mainTopic?: string;
    contentAngle?: string;
    cta?: string;
    linkedProductOrFeature?: string;
    linkedUrl?: string;
  }>({
    system:
      "You refine copy only for LECIPM (Quebec real estate legal-tech). Output strict JSON. Do NOT change platforms, taxonomy pillars, or slot structure — only optional wording for mainTopic, contentAngle, cta, linkedProductOrFeature, linkedUrl.",
    user: `Plan date: ${args.planDate}. Seed topic: ${mainTopicBase}. Seed family: ${family}. Base slots (fixed): ${JSON.stringify(
      baseSlots.map((s) => ({
        platform: s.platform,
        taxonomyPillar: s.taxonomyPillar,
        hookPattern: s.hookPattern,
      })),
    )}`,
    label: "daily_plan_refine",
  });

  if (!res.ok) {
    const fb = fallbackPlan(args.planDate, args.focus);
    fb.slots = baseSlots;
    return fb;
  }

  const d = res.data;
  return {
    ...basePlan,
    mainTopic: typeof d.mainTopic === "string" && d.mainTopic.trim() ? d.mainTopic.trim() : basePlan.mainTopic,
    contentAngle:
      typeof d.contentAngle === "string" && d.contentAngle.trim() ? d.contentAngle.trim() : basePlan.contentAngle,
    cta: typeof d.cta === "string" && d.cta.trim() ? d.cta.trim() : basePlan.cta,
    linkedProductOrFeature:
      typeof d.linkedProductOrFeature === "string" && d.linkedProductOrFeature.trim()
        ? d.linkedProductOrFeature.trim()
        : basePlan.linkedProductOrFeature,
    linkedUrl: typeof d.linkedUrl === "string" ? d.linkedUrl : basePlan.linkedUrl,
    slots: baseSlots,
  };
}
