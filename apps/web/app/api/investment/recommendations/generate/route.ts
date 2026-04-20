import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { generateRecommendationsForActiveListings } from "@/modules/investment/recommendation-batch.service";

export const dynamic = "force-dynamic";

/** POST — admin only: batch-generate BNHub listing recommendations. */
export async function POST() {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  try {
    const results = await generateRecommendationsForActiveListings();
    return NextResponse.json({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
