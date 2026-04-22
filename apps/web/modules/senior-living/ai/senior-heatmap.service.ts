/**
 * Area intelligence for families — distinct from map tile heatmap GeoJSON builder.
 */
import { prisma } from "@/lib/db";
import { logSeniorAi } from "@/lib/senior-ai/log";

export type AreaInsightComputeInput = {
  city: string;
  concentrationOfGoodMatches: number;
  averageOperatorPerformance: number;
  recentConversionStrength: number;
  priceFitDensity: number;
};

export function computeAreaScore(input: AreaInsightComputeInput): number {
  const s =
    0.35 * input.concentrationOfGoodMatches +
    0.25 * input.averageOperatorPerformance +
    0.2 * input.recentConversionStrength +
    0.2 * input.priceFitDensity;
  return Math.round(Math.max(0, Math.min(100, s)) * 10) / 10;
}

export async function upsertAreaInsight(args: {
  city: string;
  areaLabel: string;
  areaScore: number;
  activeResidences: number;
  averageConversionRate?: number | null;
  averageMatchScore?: number | null;
}): Promise<void> {
  await prisma.seniorAreaInsight.upsert({
    where: {
      city_areaLabel: { city: args.city, areaLabel: args.areaLabel },
    },
    create: {
      city: args.city,
      areaLabel: args.areaLabel,
      areaScore: args.areaScore,
      activeResidences: args.activeResidences,
      averageConversionRate: args.averageConversionRate ?? undefined,
      averageMatchScore: args.averageMatchScore ?? undefined,
    },
    update: {
      areaScore: args.areaScore,
      activeResidences: args.activeResidences,
      averageConversionRate: args.averageConversionRate ?? undefined,
      averageMatchScore: args.averageMatchScore ?? undefined,
    },
  });
  logSeniorAi("[senior-heatmap]", "upsert_area", { city: args.city });
}
