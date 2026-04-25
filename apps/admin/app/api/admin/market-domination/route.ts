import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildDominationSummary } from "@/modules/market-domination/growth-domination.service";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!engineFlags.marketDominationV1) {
    return NextResponse.json({ error: "Market domination disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const summary = buildDominationSummary({});
  const freshness = new Date().toISOString();

  return NextResponse.json({ summary, freshness });
}
