import { assertDealRoomAccess } from "@/lib/deals/access";
import { updateDealRoomTask } from "@/lib/deals/update-task";
import { parseTaskStatus } from "@/lib/deals/validators";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id, taskId } = await params;
  const access = await assertDealRoomAccess(id, auth.userId, auth.role);
  if (!access.ok) {
    return Response.json({ error: "Not found" }, { status: access.status });
  }

  let body: {
    title?: unknown;
    description?: unknown;
    status?: unknown;
    assignedUserId?: unknown;
    dueAt?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status != null ? parseTaskStatus(body.status) : undefined;
  const dueAt =
    body.dueAt === null
      ? null
      : typeof body.dueAt === "string" || body.dueAt instanceof Date
        ? new Date(body.dueAt as string | Date)
        : undefined;

  try {
    const task = await updateDealRoomTask({
      dealRoomId: id,
      taskId,
      title: typeof body.title === "string" ? body.title : undefined,
      description: body.description === null ? null : typeof body.description === "string" ? body.description : undefined,
      status: status ?? undefined,
      assignedUserId:
        body.assignedUserId === null
          ? null
          : typeof body.assignedUserId === "string"
            ? body.assignedUserId
            : undefined,
      dueAt,
      actorUserId: auth.userId,
    });
    return Response.json({ task });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
