import { findDealForParticipant } from "@/lib/deals/execution-access";
import { getGuestId } from "@/lib/auth/session";
import { dealTransactionFlags } from "@/config/feature-flags";
import { buildDealTimeline } from "@/modules/deal-execution/timeline.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!dealTransactionFlags.dealExecutionV1 && !dealTransactionFlags.clientDealViewV1) {
    return Response.json({ error: "Timeline disabled" }, { status: 403 });
  }
  const { id: dealId } = await context.params;
  const userId = await getGuestId();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const deal = await findDealForParticipant(dealId, userId);
  if (!deal) return Response.json({ error: "Not found" }, { status: 404 });

  const events = await buildDealTimeline(dealId);
  return Response.json({
    events,
    disclaimer: "Timeline reflects platform activity — not a legal chain of title or official registry.",
  });
}
