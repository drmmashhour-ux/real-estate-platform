import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logInfo } from "@/lib/logger";
import { getPipelineDealDetail } from "@/modules/deals/deal-pipeline.service";
import { userCanViewPipelineDeal } from "@/modules/deals/deal-access";

export const dynamic = "force-dynamic";

const TAG = "[deal-pipeline]";

export async function GET(_request: Request, context: { params: Promise<{ dealId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { dealId } = await context.params;
  if (!(await userCanViewPipelineDeal(userId, dealId))) {
    logInfo(`${TAG}`, { denied: true, dealId });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deal = await getPipelineDealDetail(dealId);
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ deal });
}
