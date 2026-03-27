import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { checkUsageLimit } from "@/src/modules/closing/application/checkUsageLimit";
import type { UsageFeature } from "@/src/modules/closing/domain/usageFeature";

export const dynamic = "force-dynamic";

const FEATURES: UsageFeature[] = ["simulator", "ai_draft", "negotiation", "advanced"];

export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const feature = searchParams.get("feature") as UsageFeature | null;
  if (!feature || !FEATURES.includes(feature)) {
    return NextResponse.json({ error: "feature must be simulator | ai_draft | negotiation | advanced" }, { status: 400 });
  }
  const result = await checkUsageLimit(userId, feature);
  return NextResponse.json({
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    limit_reached: result.limitReached,
    feature: result.feature,
  });
}
