import type { GrowthMarketingPlatform } from "@prisma/client";
import { computeContentPerformanceScore } from "@/src/modules/growth-automation/analytics/computeContentPerformanceScore";
import { extractTaxonomyPillarFromDraft } from "@/src/modules/growth-automation/application/taxonomyPayload";
import type { ContentPillar } from "@/src/modules/growth-automation/domain/contentTaxonomy";
import { listPerformanceForOptimization } from "@/src/modules/growth-automation/infrastructure/growthAutomationRepository";
import type { DraftPayload } from "@/src/modules/growth-automation/domain/growth-automation.types";

export type PerformanceRowWithItem = Awaited<ReturnType<typeof listPerformanceForOptimization>>[number];

export type TaxonomyPerformanceInsights = {
  topTopics: string[];
  topHooks: string[];
  topPlatforms: Array<{ platform: GrowthMarketingPlatform; score: number }>;
  pillarLift: Partial<Record<ContentPillar, number>>;
};

function hookFromPayload(d: DraftPayload | undefined): string | null {
  if (!d?.hook) return null;
  return d.hook.slice(0, 120);
}

export async function analyzePerformanceTaxonomy(
  rowsInput?: PerformanceRowWithItem[],
): Promise<TaxonomyPerformanceInsights> {
  const rows = rowsInput ?? (await listPerformanceForOptimization());
  const scored = rows.map((r) => {
    const s = computeContentPerformanceScore({
      views: r.views,
      clicks: r.clicks ?? 0,
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
      conversions: r.conversions,
    });
    const draft = r.contentItem.draftPayload as DraftPayload | undefined;
    const pillar = draft ? extractTaxonomyPillarFromDraft(draft) : null;
    return {
      score: s,
      topic: r.contentItem.topic,
      platform: r.platform,
      hook: hookFromPayload(draft),
      pillar,
    };
  });

  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const topTopics = [...new Set(sorted.slice(0, 5).map((x) => x.topic))];
  const topHooks = [...new Set(sorted.slice(0, 8).map((x) => x.hook).filter(Boolean))] as string[];

  const platformScore = new Map<GrowthMarketingPlatform, number[]>();
  for (const x of scored) {
    const arr = platformScore.get(x.platform) ?? [];
    arr.push(x.score);
    platformScore.set(x.platform, arr);
  }
  const topPlatforms = [...platformScore.entries()]
    .map(([platform, scores]) => ({
      platform,
      score: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))
    .sort((a, b) => b.score - a.score);

  const pillarLift: Partial<Record<ContentPillar, number>> = {};
  for (const p of scored) {
    if (!p.pillar) continue;
    pillarLift[p.pillar] = (pillarLift[p.pillar] ?? 0) + p.score;
  }

  return { topTopics, topHooks, topPlatforms, pillarLift };
}
