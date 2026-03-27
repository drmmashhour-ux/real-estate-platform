import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { listPlans } from "@/lib/monetization";

/**
 * GET /api/monetization/plans
 * Query: module?, active?, marketId?
 */
export async function GET(request: NextRequest) {
  try {
    await getGuestId();
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module") ?? undefined;
    const active = searchParams.get("active");
    const marketId = searchParams.get("marketId") ?? undefined;
    const plans = await listPlans({
      module,
      active: active !== undefined ? active === "true" : undefined,
      marketId,
    });
    return Response.json({ plans });
  } catch (e) {
    return Response.json({ error: "Failed to list plans" }, { status: 500 });
  }
}
