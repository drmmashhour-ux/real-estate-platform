import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { computeExpansionMeasurements } from "@/modules/self-expansion/self-expansion-outcome.service";
import { loadLearningWeights, summarizeLearningPatterns } from "@/modules/self-expansion/self-expansion-learning.service";
import { syncSelfExpansionRecommendationsFromEngine } from "@/modules/self-expansion/self-expansion-sync.service";

export const dynamic = "force-dynamic";

/** GET — sync live expansion engine into audit table + return rows + measurements + learning summary. */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { context, recommendations: liveDrafts } = await syncSelfExpansionRecommendationsFromEngine();
    const [rows, measurements, weights] = await Promise.all([
      prisma.lecipmSelfExpansionRecommendation.findMany({
        orderBy: [{ expansionScore: "desc" }, { lastRefreshedAt: "desc" }],
        take: 200,
      }),
      computeExpansionMeasurements(),
      loadLearningWeights(),
    ]);

    return NextResponse.json({
      success: true,
      contextSummary: {
        generatedAt: context.generatedAt,
        thinDataWarnings: context.thinDataWarnings,
        executiveRisk: context.aiCeo.executiveRisk,
        revenuePredictorAt: context.revenuePredictor.generatedAtIso,
      },
      liveDrafts,
      recommendations: rows,
      measurements,
      learningPatterns: summarizeLearningPatterns(weights),
    });
  } catch (e) {
    console.error("[self-expansion/recommendations]", e);
    return NextResponse.json({ error: "self_expansion_failed" }, { status: 500 });
  }
}
