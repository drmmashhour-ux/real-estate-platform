import { NextRequest } from "next/server";
import { dealExecutionFlags } from "@/config/feature-flags";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { logDraftingAudit } from "@/lib/deals/drafting-audit";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runDraftingEngineSafeMode } from "@/modules/drafting-ai/drafting-engine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  if (!dealExecutionFlags.contractIntelligenceV1) {
    return Response.json({ error: "Drafting intelligence disabled" }, { status: 403 });
  }

  let persist = false;
  try {
    const b = await request.json();
    persist = b?.persist === true;
  } catch {
    persist = false;
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true } });
  if (persist && (!user || !canMutateExecution(auth.userId, user.role, auth.deal))) {
    return Response.json({ error: "Forbidden to persist suggestions" }, { status: 403 });
  }

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { dealParties: { select: { id: true } } },
  });
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const payload = await runDraftingEngineSafeMode(deal, { persistSuggestions: persist });

  await logDraftingAudit({
    dealId,
    actorUserId: auth.userId,
    actionKey: "drafting_suggest",
    payload: { persist, reviewQueueCount: payload.reviewQueueSuggestions.length },
  });

  return Response.json(payload);
}
