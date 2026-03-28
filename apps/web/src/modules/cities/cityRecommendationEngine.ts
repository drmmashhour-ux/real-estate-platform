import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeCityKey } from "@/src/modules/cities/cityNormalizer";
import type { CityBottleneck } from "@/src/modules/cities/cityBottleneckEngine";
import { detectAllCityBottlenecks } from "@/src/modules/cities/cityBottleneckEngine";
import { getCityOperationProfile } from "@/src/modules/cities/cityConfigService";
import { isCityAutoRecommendationsEnabled } from "@/src/modules/cities/cityEnv";
import { saveExecutiveRecommendations } from "@/src/modules/executive/recommendationEngine";
import type { ExecutiveRecommendationInput } from "@/src/modules/executive/recommendationEngine";

export type CityRecommendationInput = {
  recommendationType: string;
  priorityScore: number;
  title: string;
  summary: string;
  detailsJson: Prisma.InputJsonValue;
  evidenceJson?: Prisma.InputJsonValue;
};

function bottleneckToRec(cityKey: string, b: CityBottleneck): CityRecommendationInput {
  const sev = b.severity === "high" ? 78 : b.severity === "medium" ? 62 : 48;
  return {
    recommendationType: `city_${b.type}`,
    priorityScore: sev,
    title: `${cityKey}: ${b.summary.slice(0, 72)}`,
    summary: b.summary,
    detailsJson: { cityKey, bottleneckType: b.type, evidence: b.evidence } as Prisma.InputJsonValue,
    evidenceJson: b.evidence as Prisma.InputJsonValue,
  };
}

export async function generateCityRecommendations(cityKey: string): Promise<CityRecommendationInput[]> {
  const key = normalizeCityKey(cityKey);
  const profile = await getCityOperationProfile(key);
  const bottlenecks = await detectAllCityBottlenecks(key);
  const recs = bottlenecks.map((b) => bottleneckToRec(key, b));

  if (profile?.launchStage === "planned" && profile.isActive === false) {
    recs.push({
      recommendationType: "city_rollout",
      priorityScore: 55,
      title: `${key}: City profile exists but is not active`,
      summary: "Review launch checklist before activating operations for this market.",
      detailsJson: { cityKey: key, launchStage: profile.launchStage },
    });
  }

  return rankCityRecommendations(recs);
}

export function rankCityRecommendations(recs: CityRecommendationInput[]): CityRecommendationInput[] {
  return [...recs].sort((a, b) => b.priorityScore - a.priorityScore);
}

export async function saveCityRecommendations(
  cityKey: string,
  recommendations: CityRecommendationInput[]
): Promise<number> {
  const key = normalizeCityKey(cityKey);
  let n = 0;
  for (const r of recommendations) {
    const dup = await prisma.cityRecommendation.findFirst({
      where: {
        cityKey: key,
        status: "open",
        title: r.title,
        createdAt: { gte: new Date(Date.now() - 72 * 3600000) },
      },
    });
    if (dup) continue;
    await prisma.cityRecommendation.create({
      data: {
        cityKey: key,
        recommendationType: r.recommendationType,
        priorityScore: r.priorityScore,
        status: "open",
        title: r.title,
        summary: r.summary,
        detailsJson: r.detailsJson as object,
        evidenceJson: r.evidenceJson as object | undefined,
      },
    });
    n++;
  }
  return n;
}

export async function generateAllActiveCityRecommendations(): Promise<number> {
  const profiles = await prisma.cityOperationProfile.findMany({
    where: { isActive: true },
    select: { cityKey: true },
  });
  let total = 0;
  for (const p of profiles) {
    const recs = await generateCityRecommendations(p.cityKey);
    total += await saveCityRecommendations(p.cityKey, recs);
  }
  return total;
}

/** Merge top city recommendations into executive_recommendations (deduped by title in saveExecutive). */
export async function mergeCityRecommendationsToExecutive(limit = 12): Promise<number> {
  if (!isCityAutoRecommendationsEnabled()) return 0;
  const rows = await prisma.cityRecommendation.findMany({
    where: { status: "open" },
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  const mapped: ExecutiveRecommendationInput[] = rows.map((r) => ({
    recommendationType: "city_operations",
    priorityScore: Math.min(100, r.priorityScore),
    title: r.title,
    summary: r.summary,
    detailsJson: {
      source: "city_recommendations",
      cityKey: r.cityKey,
      cityRecommendationId: r.id,
      recommendationType: r.recommendationType,
    },
    evidenceJson: (r.evidenceJson ?? r.detailsJson) as Prisma.InputJsonValue,
    targetEntityType: "city",
    targetEntityId: r.cityKey,
  }));
  return saveExecutiveRecommendations(mapped);
}
