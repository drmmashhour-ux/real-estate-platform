import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import {
  canAccessPipelineDeal,
  canSubmitToCommittee,
  requireAuthUser,
} from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";
import { submitToCommittee } from "@/modules/deals/deal-committee.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  if (!canSubmitToCommittee(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { dealId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const summary = typeof body.summary === "string" ? body.summary : "";

  if (!summary.trim()) return NextResponse.json({ error: "summary required" }, { status: 400 });

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessPipelineDeal(auth.role, auth.userId, deal)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submission = await submitToCommittee(dealId, summary, auth.userId);
    return NextResponse.json({ submission });
  } catch (e) {
    logError("[api.deals.committee.submit]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
