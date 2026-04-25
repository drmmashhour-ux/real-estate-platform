import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  buildGlobalInvestorDashboard,
  buildRegionComparisonSummary,
  buildRegionGrowthComparison,
  buildRegionRiskComparison,
  buildTrustComparisonSummary,
} from "@/modules/global-intelligence/global-dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!engineFlags.globalDashboardV1) {
    return NextResponse.json({ error: "Global dashboard disabled" }, { status: 403 });
  }

  const url = new URL(req.url);
  const slice = url.searchParams.get("slice")?.trim().toLowerCase() ?? "";

  try {
    if (slice === "comparison") {
      const summary = await buildRegionComparisonSummary();
      return NextResponse.json({
        slice: "comparison",
        summary,
        freshness: new Date().toISOString(),
      });
    }
    if (slice === "risk") {
      const summary = await buildRegionRiskComparison();
      return NextResponse.json({ slice: "risk", summary });
    }
    if (slice === "growth") {
      const summary = await buildRegionGrowthComparison();
      return NextResponse.json({ slice: "growth", summary });
    }
    if (slice === "trust") {
      const summary = await buildTrustComparisonSummary();
      return NextResponse.json({ slice: "trust", summary });
    }

    const dashboard = await buildGlobalInvestorDashboard();
    return NextResponse.json({
      dashboard,
      freshness: dashboard.freshness,
    });
  } catch {
    return NextResponse.json({ error: "global_dashboard_unavailable" }, { status: 503 });
  }
}
