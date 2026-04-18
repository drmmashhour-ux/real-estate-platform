import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { canMutateExecution, loadDealWithActor } from "@/lib/deals/execution-access";
import { resolveCopilotSuggestion } from "@/modules/review/broker-review.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string; suggestionId: string }> }) {
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id: dealId, suggestionId } = await context.params;
  const { deal, user } = await loadDealWithActor(dealId, userId);
  if (!deal || !user) return Response.json({ error: "Not found" }, { status: 404 });
  if (!canMutateExecution(userId, user.role, deal)) return Response.json({ error: "Forbidden" }, { status: 403 });

  let note: string | undefined;
  try {
    const b = await request.json();
    note = typeof b.note === "string" ? b.note : undefined;
  } catch {
    note = undefined;
  }

  try {
    await resolveCopilotSuggestion({ dealId, suggestionId, actorUserId: userId, status: "approved", note });
  } catch (e) {
    if (e instanceof Error && e.message === "suggestion_not_found") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw e;
  }
  return Response.json({ ok: true });
}
