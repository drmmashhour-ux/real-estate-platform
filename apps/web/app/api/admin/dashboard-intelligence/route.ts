import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildMarketplaceDashboardSummary } from "@/modules/dashboard-intelligence/dashboard-intelligence.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.marketplaceDashboardV1) {
    return NextResponse.json({ error: "Dashboard intelligence disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const summary = await buildMarketplaceDashboardSummary();
  const freshness = new Date().toISOString();

  return NextResponse.json({
    summary,
    flags: {
      marketplaceDashboardV1: engineFlags.marketplaceDashboardV1,
      syriaRegionAdapterV1: engineFlags.syriaRegionAdapterV1,
      autonomousMarketplaceV1: engineFlags.autonomousMarketplaceV1,
      controlledExecutionV1: engineFlags.controlledExecutionV1,
    },
    freshness,
  });
}
