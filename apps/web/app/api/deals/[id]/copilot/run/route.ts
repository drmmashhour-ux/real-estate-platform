import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateExecution, loadDealWithActor } from "@/lib/deals/execution-access";
import { runCopilotForDealId } from "@/modules/deal-copilot/deal-copilot.service";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canMutateExecution(userId, user.role, deal)) {
    return Response.json({ error: "Broker or admin only" }, { status: 403 });
  }

  const result = await runCopilotForDealId(dealId, userId);
  return Response.json(result);
}
