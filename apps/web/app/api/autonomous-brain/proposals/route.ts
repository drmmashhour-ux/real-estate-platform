import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  listMarketplaceOptimizationProposals,
  type MarketplaceOptimizationUiStatus,
} from "@/modules/marketplace/marketplace-optimization-approval.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("uiStatuses");
  const uiStatuses =
    raw ?
      (raw.split(",").map((s) => s.trim()).filter(Boolean) as MarketplaceOptimizationUiStatus[])
    : undefined;
  const take = Number(url.searchParams.get("take") ?? "120") || 120;

  try {
    const proposals = await listMarketplaceOptimizationProposals({ uiStatuses, take });
    return NextResponse.json({
      proposals,
      explainability: {
        dataSources: ["Autonomy engine → autonomy_decisions + baseline snapshots"],
        advisoryOnly: true,
      },
    });
  } catch (e) {
    console.error("[autonomous-brain/proposals]", e);
    return NextResponse.json({ error: "proposals_failed" }, { status: 500 });
  }
}
