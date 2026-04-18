import { NextRequest } from "next/server";
import { requireBrokerDealAccess, requireBrokerResidentialSession } from "@/lib/broker/residential-access";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";
import { resolveCopilotSuggestion } from "@/modules/review/broker-review.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; suggestionId: string }> }) {
  const session = await requireBrokerResidentialSession();
  if ("response" in session) return session.response;
  const { id: dealId, suggestionId } = await context.params;
  const deal = await requireBrokerDealAccess(session.userId, dealId, session.role === "ADMIN");
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } });
  if (!user || !canMutateExecution(session.userId, user.role, deal)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let note: string | undefined;
  try {
    const b = await request.json();
    note = typeof b.note === "string" ? b.note : undefined;
  } catch {
    note = undefined;
  }

  try {
    await resolveCopilotSuggestion({ dealId, suggestionId, actorUserId: session.userId, status: "rejected", note });
  } catch (e) {
    if (e instanceof Error && e.message === "suggestion_not_found") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
  return Response.json({ ok: true });
}
