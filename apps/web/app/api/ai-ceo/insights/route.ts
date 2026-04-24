import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildAiCeoInsightsPackage } from "@/modules/ai-ceo/strategy.engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai-ceo/insights — BNHub/LECIPM strategic support (internal metrics only, advisory).
 * No automatic execution; reasoning is embedded per item.
 */
export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const pack = await buildAiCeoInsightsPackage();
    return NextResponse.json({
      success: true,
      advisoryOnly: true,
      noAutoExecution: true,
      summary: pack.summary,
      topPriorities: pack.topPriorities,
      risks: pack.strategicInsights.risks,
      opportunities: pack.strategicInsights.opportunities,
      recommendations: pack.strategicInsights.recommendedActions,
      keyInsights: pack.strategicInsights.keyInsights,
      alerts: pack.alerts,
      prioritized: pack.prioritized,
      contextMeta: pack.contextMeta,
    });
  } catch (e) {
    console.error("[ai-ceo/insights]", e);
    return NextResponse.json({ error: "insights_failed" }, { status: 500 });
  }
}
