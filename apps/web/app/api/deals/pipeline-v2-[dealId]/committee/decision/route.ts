import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { canRecordCommitteeDecision, requireAuthUser } from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";
import { recordCommitteeDecision } from "@/modules/deals/deal-committee.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!canRecordCommitteeDecision(auth.role)) {
    return NextResponse.json({ error: "Committee / investor / admin only" }, { status: 403 });
  }

  const { dealId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const recommendation = typeof body.recommendation === "string" ? body.recommendation : "";
  const rationale = typeof body.rationale === "string" ? body.rationale : "";
  const submissionId = typeof body.submissionId === "string" ? body.submissionId : undefined;
  const confidenceLevel =
    typeof body.confidenceLevel === "string" ? body.confidenceLevel : undefined;

  if (!recommendation || !rationale) {
    return NextResponse.json({ error: "recommendation and rationale required" }, { status: 400 });
  }

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await recordCommitteeDecision({
      dealId,
      submissionId,
      decidedByUserId: auth.userId,
      recommendation,
      rationale,
      confidenceLevel,
    });

    return NextResponse.json({ deal: updated });
  } catch (e) {
    logError("[api.deals.committee.decision]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
