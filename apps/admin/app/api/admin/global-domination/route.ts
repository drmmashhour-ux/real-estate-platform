import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  buildCrossRegionExpansionTargets,
  buildCrossRegionPricingSignals,
  buildCrossRegionTrustLeverageSummary,
  buildGlobalDominationSummary,
} from "@/modules/market-domination/global-market-domination.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (!engineFlags.globalDominationV1) {
    return NextResponse.json({ error: "Global domination disabled" }, { status: 403 });
  }

  const url = new URL(req.url);
  const slice = url.searchParams.get("slice")?.trim().toLowerCase() ?? "";

  try {
    if (slice === "expansion") {
      return NextResponse.json({ slice, ...buildCrossRegionExpansionTargets(), freshness: new Date().toISOString() });
    }
    if (slice === "pricing") {
      return NextResponse.json({ slice, ...buildCrossRegionPricingSignals(), freshness: new Date().toISOString() });
    }
    if (slice === "trust") {
      const t = await buildCrossRegionTrustLeverageSummary();
      return NextResponse.json({ slice, ...t });
    }

    const summary = await buildGlobalDominationSummary();
    return NextResponse.json({ summary, freshness: summary?.freshness ?? new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "global_domination_unavailable" }, { status: 503 });
  }
}
