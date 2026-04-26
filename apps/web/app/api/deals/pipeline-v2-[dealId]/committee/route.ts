import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import {
  canAccessPipelineDeal,
  canRecordCommitteeDecision,
  requireAuthUser,
} from "@/lib/deals/guard-pipeline-deal";
import { getDealById } from "@/modules/deals/deal.service";
import { getCommitteeSubmission } from "@/modules/deals/deal-committee.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ dealId: string }> }) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { dealId } = await context.params;

  try {
    const deal = await getDealById(dealId);
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const allowed =
      canAccessPipelineDeal(auth.role, auth.userId, deal) || canRecordCommitteeDecision(auth.role);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submission = await getCommitteeSubmission(dealId);
    const decisions = await prisma.lecipmPipelineDealCommitteeDecision.findMany({
      where: { dealId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ submission, decisions });
  } catch (e) {
    logError("[api.deals.committee.get]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
