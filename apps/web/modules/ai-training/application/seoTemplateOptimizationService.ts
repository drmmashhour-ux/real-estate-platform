import { buildSeoTrainingDataset } from "./seoTrainingDatasetBuilder";
import type { PrismaClient } from "@prisma/client";

export async function getSeoTemplateOptimizationSuggestions(db: PrismaClient, days = 60) {
  const ds = await buildSeoTrainingDataset(db, days);
  const low = ds.filter((x) => x.views >= 20 && x.signupRate < 0.01).slice(0, 20);
  return {
    days,
    totalPagesAnalyzed: ds.length,
    lowPerformingPages: low.length,
    suggestions: [
      "Use intent-first title pattern: question + city + metric.",
      "Move primary CTA above fold for low-signup pages.",
      "Add trust/deal snapshot blocks before long narrative text.",
      "Use tighter headings with city + intent keyword pairs.",
    ],
    pageCandidates: low.map((x) => ({
      path: x.path,
      views: x.views,
      signupRate: x.signupRate,
      analysisRate: x.analysisRate,
    })),
  };
}
