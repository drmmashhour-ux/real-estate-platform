import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { generateRecommendationsForActiveListings } from "@/modules/investment/recommendation-batch.service";

export const dynamic = "force-dynamic";

/**
 * POST — cron-friendly refresh: either `x-investment-secret` matching
 * `INVESTMENT_RECOMMENDATION_SECRET` or **admin session**.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("x-investment-secret");
  const expected = process.env.INVESTMENT_RECOMMENDATION_SECRET?.trim();
  const secretOk = Boolean(expected && authHeader === expected);

  if (!secretOk) {
    const auth = await requireRole("admin");
    if (!auth.ok) return auth.response;
  }

  try {
    const results = await generateRecommendationsForActiveListings();
    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recommendation refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
