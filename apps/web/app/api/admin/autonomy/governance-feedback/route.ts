import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { autonomyConfig } from "@/modules/autonomous-marketplace/config/autonomy.config";
import { buildGovernancePerformanceSummary } from "@/modules/autonomous-marketplace/feedback/governance-feedback-metrics.service";
import { listGovernanceFeedbackRecordsLastN } from "@/modules/autonomous-marketplace/feedback/governance-feedback.repository";
import { recommendGovernanceThresholdAdjustments } from "@/modules/autonomous-marketplace/feedback/governance-threshold-recommendation.service";
import {
  buildGovernanceFeedbackAdminSummary,
  buildGovernanceFeedbackInvestorSummary,
} from "@/modules/autonomous-marketplace/dashboard/governance-feedback-dashboard.service";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 500;

export async function GET(req: NextRequest) {
  if (!engineFlags.autonomousMarketplaceV1 || !autonomyConfig.enabled) {
    return NextResponse.json({ ok: false, error: "Autonomous marketplace disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  try {
    const limitRaw = req.nextUrl.searchParams.get("limit");
    const parsed = limitRaw ? parseInt(limitRaw, 10) : DEFAULT_LIMIT;
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 5000) : DEFAULT_LIMIT;

    const rows = listGovernanceFeedbackRecordsLastN(limit);
    const results = rows.map((r) => r.result);

    const performanceSummary = buildGovernancePerformanceSummary(results);
    const thresholdRecommendations = recommendGovernanceThresholdAdjustments({
      summary: performanceSummary,
      results,
    });
    const adminSummary = buildGovernanceFeedbackAdminSummary({
      summary: performanceSummary,
      recommendations: thresholdRecommendations,
    });
    const investorSummary = buildGovernanceFeedbackInvestorSummary({ summary: performanceSummary });

    return NextResponse.json({
      ok: true,
      performanceSummary,
      thresholdRecommendations,
      adminSummary,
      investorSummary,
    });
  } catch (e) {
    console.error("[governance-feedback] GET failed", e);
    const empty = buildGovernancePerformanceSummary([]);
    const thresholdRecommendations = recommendGovernanceThresholdAdjustments({ summary: empty, results: [] });
    return NextResponse.json({
      ok: true,
      performanceSummary: empty,
      thresholdRecommendations,
      adminSummary: buildGovernanceFeedbackAdminSummary({
        summary: empty,
        recommendations: thresholdRecommendations,
      }),
      investorSummary: buildGovernanceFeedbackInvestorSummary({ summary: empty }),
      fallback: true,
    });
  }
}
