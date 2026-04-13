import { assertDealRoomAccess } from "@/lib/deals/access";
import { updateDealRoomNextAction } from "@/lib/deals/update-next-action";
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

  let body: {
    nextAction?: unknown;
    nextFollowUpAt?: unknown;
    summary?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextFollowUpAt =
    body.nextFollowUpAt === null
      ? null
      : typeof body.nextFollowUpAt === "string"
        ? new Date(body.nextFollowUpAt)
        : undefined;

  const room = await updateDealRoomNextAction({
    dealRoomId: id,
    nextAction: typeof body.nextAction === "string" ? body.nextAction : undefined,
    nextFollowUpAt,
    summary: typeof body.summary === "string" ? body.summary : undefined,
    actorUserId: auth.userId,
  });
  return Response.json({ dealRoom: room });
}
