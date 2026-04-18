import { NextResponse } from "next/server";
import { listGrowthRecommendations } from "@/modules/growth-automation";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

/** Recomputes recommendations — still review-only (no outbound sends). */
export async function POST() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  const recs = await listGrowthRecommendations(auth.userId);
  return NextResponse.json({ ok: true, recommendations: recs });
}
