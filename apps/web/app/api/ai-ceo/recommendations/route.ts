import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { computeAiCeoMeasurements } from "@/modules/ai-ceo/ai-ceo-outcome.service";
import { syncAiCeoRecommendationsFromEngine } from "@/modules/ai-ceo/ai-ceo-sync.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET — refresh recommendations from live signals + return persisted audit rows + measurements. */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { context, prioritized } = await syncAiCeoRecommendationsFromEngine();
    const [rows, measurements] = await Promise.all([
      prisma.lecipmAiCeoRecommendation.findMany({
        orderBy: [{ confidenceScore: "desc" }, { lastRefreshedAt: "desc" }],
        take: 120,
      }),
      computeAiCeoMeasurements(),
    ]);

    return NextResponse.json({
      success: true,
      contextSummary: {
        generatedAt: context.generatedAt,
        thinDataWarnings: context.coverage.thinDataWarnings,
        executiveRisk: context.executive?.riskLevel ?? null,
      },
      prioritized,
      recommendations: rows,
      measurements,
    });
  } catch (e) {
    console.error("[ai-ceo/recommendations]", e);
    return NextResponse.json({ error: "recommendations_failed" }, { status: 500 });
  }
}
