import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { logDealExecutionEvent } from "@/lib/deals/execution-events";
import { canMutateExecution, loadDealWithActor } from "@/lib/deals/execution-access";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { runContractIntelligence } from "@/modules/contract-intelligence/contract-intelligence.engine";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canMutateExecution(userId, user.role, deal)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const full = await prisma.deal.findUnique({ where: { id: deal.id } });
  if (!full) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await runContractIntelligence(full);
  await logDealExecutionEvent({
    eventType: "document_issue_detected",
    userId,
    dealId,
    metadata: { issueCount: result.issues.length },
  });

  return Response.json(result);
}
