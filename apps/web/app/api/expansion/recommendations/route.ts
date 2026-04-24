import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { prisma } from "@/lib/db";
import { buildExpansionRecommendations } from "@/modules/expansion-ai/recommendation.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/expansion/recommendations — advisory expansion ranking from internal LECIPM/BNHub telemetry only.
 * Does not create cities, change flags, or trigger rollouts.
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const pack = await buildExpansionRecommendations(prisma);
    return NextResponse.json({
      success: true,
      advisoryOnly: true,
      noAutoExecution: true,
      bestCity: pack.bestCity,
      reasoning: pack.reasoning,
      riskLevel: pack.riskLevel,
      ranked: pack.ranked,
      weights: pack.weights,
      generatedAt: pack.generatedAt,
    });
  } catch (e) {
    console.error("[expansion/recommendations]", e);
    return NextResponse.json({ error: "expansion_recommendations_failed" }, { status: 500 });
  }
}
