import { assertDealRoomAccess } from "@/lib/deals/access";
import { parseStage } from "@/lib/deals/validators";
import { updateDealRoomStage } from "@/lib/deals/update-stage";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  const access = await assertDealRoomAccess(id, auth.userId, auth.role);
  if (!access.ok) {
    return Response.json({ error: "Not found" }, { status: access.status });
  }

  let body: { stage?: unknown };
  try {
    body = (await req.json()) as { stage?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const stage = parseStage(body.stage);
  if (!stage) {
    return Response.json({ error: "Invalid stage" }, { status: 400 });
  }

  const room = await updateDealRoomStage({
    dealRoomId: id,
    stage,
    actorUserId: auth.userId,
  });
  return Response.json({ dealRoom: room });
}
