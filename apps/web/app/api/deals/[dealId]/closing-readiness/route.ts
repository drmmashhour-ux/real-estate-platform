import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
  evaluateClosingReadiness,
  getStoredClosingReadiness,
} from "@/modules/capital/closing-readiness.service";
import { canManageCapital } from "@/modules/capital/capital-policy";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;
  const refresh = new URL(req.url).searchParams.get("refresh") === "1";

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (refresh) {
      if (!canManageCapital(auth.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const evaluated = await evaluateClosingReadiness(dealId, auth.userId);
      return NextResponse.json(evaluated);
    }

    const stored = await getStoredClosingReadiness(dealId);
    return NextResponse.json({
      stored,
      readinessStatus: stored?.readinessStatus ?? null,
      hint: stored ? undefined : "Add ?refresh=1 to compute (broker/admin)",
    });
  } catch (e) {
    logError("[api.deals.closing-readiness.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
