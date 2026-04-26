import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { loadDealWithActor } from "@/lib/deals/execution-access";
import { loadCopilotSuggestions } from "@/modules/deal-copilot/deal-copilot.service";
import { suggestWorkflowPackage } from "@/modules/form-packages/workflow-matcher.service";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });

  const [suggestions, full] = await Promise.all([
    loadCopilotSuggestions(dealId),
    prisma.deal.findUnique({ where: { id: dealId } }),
  ]);
  const workflowHint = full ? suggestWorkflowPackage(full) : null;

  return Response.json({ suggestions, workflowHint });
}
