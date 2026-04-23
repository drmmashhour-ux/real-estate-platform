import { NextResponse } from "next/server";
import { intelligenceFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { logMemoryAudit } from "@/lib/marketplace-memory/memory-audit";
import { getUserInsights } from "@/lib/marketplace-memory/memory-query.service";

export const dynamic = "force-dynamic";

/** GET /api/memory/insights — explainable insights with confidence + source traces. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return NextResponse.json({ ok: true, disabled: true, insights: [] });
  }

  const insights = await getUserInsights(auth.user.id);
  void logMemoryAudit({
    userId: auth.user.id,
    actionType: "memory_read",
    summary: "Memory insights list read",
    actorId: auth.user.id,
    details: { count: insights.length },
  }).catch(() => null);

  return NextResponse.json({ ok: true, insights });
}
