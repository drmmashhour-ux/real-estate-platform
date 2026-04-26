import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { isLeadScoringEnabled } from "@/lib/feature-flags/revenue-growth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { listTopLeads } from "@/modules/lead-scoring/infrastructure/leadScoringService";

export const dynamic = "force-dynamic";

/** GET — top users by deterministic lead score (admin-only; feature-flagged). */
export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!isLeadScoringEnabled()) {
    return NextResponse.json(
      { error: "Lead scoring disabled", feature: "LEAD_SCORING_ENABLED" },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const take = Math.min(100, Math.max(5, Number(searchParams.get("take")) || 25));
  try {
    const top = await listTopLeads(prisma, take);
    return NextResponse.json({ leads: top });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to score leads";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
