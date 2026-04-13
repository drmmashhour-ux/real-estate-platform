import { loadDealRoomPageData } from "@/lib/deals/load-deal-room-page";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const payload = await loadDealRoomPageData(id, auth.userId, auth.role);
  if (!payload.ok) {
    return Response.json({ error: "Not found" }, { status: payload.status });
  }
  return Response.json({
    dealRoom: payload.data.room,
    threadPreview: payload.data.threadPreview,
    visits: payload.data.visits,
    insights: payload.data.insights,
    aiSummary: payload.data.aiSummary,
    recommendedNextAction: payload.data.recommendedNextAction,
  });
}
