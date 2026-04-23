import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { evaluateClosing } from "@/modules/closing/closing-validation.service";
import { getClosingByDealId } from "@/modules/closing/closing.service";
import { canAccessPipelineDeal, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;
  const withValidation = new URL(req.url).searchParams.get("validate") === "1";

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const closing = await getClosingByDealId(dealId);
    const validation =
      withValidation ?
        await evaluateClosing(dealId)
      : undefined;

    return NextResponse.json({ closing, validation });
  } catch (e) {
    logError("[api.deals.closing.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
