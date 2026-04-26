import { NextRequest } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { requireAiContractEngine } from "@/lib/contract-engine/guard";
import { logSuggestionDecision } from "@/modules/review/audit-trail.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const blocked = requireAiContractEngine();
  if (blocked) return blocked;

  const { id: dealId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true } });
  if (!user || !canMutateExecution(auth.userId, user.role, auth.deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { suggestionType?: string; suggestionPayload?: Record<string, unknown>; documentId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await logSuggestionDecision({
    dealId,
    actorId: auth.userId,
    action: "reject",
    suggestionType: body.suggestionType ?? "unspecified",
    suggestionPayload: body.suggestionPayload ?? {},
    documentId: body.documentId,
  });

  return Response.json({ ok: true });
}
