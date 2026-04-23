import { NextResponse } from "next/server";
import { intelligenceFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { aggregateUserMemory } from "@/lib/marketplace-memory/memory-aggregation.engine";

export const dynamic = "force-dynamic";

/** POST /api/memory/aggregate — recompute summaries + insights from stored events. */
export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (!intelligenceFlags.marketplaceMemoryEngineV1) {
    return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 404 });
  }

  const result = await aggregateUserMemory(auth.user.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason ?? "unknown" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
