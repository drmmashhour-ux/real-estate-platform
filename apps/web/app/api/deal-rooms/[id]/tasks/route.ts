import { assertDealRoomAccess } from "@/lib/deals/access";
import { addDealRoomTask } from "@/lib/deals/add-task";
import { parseTaskStatus } from "@/lib/deals/validators";
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
  if (typeof body.title !== "string" || !body.title.trim()) {
    return Response.json({ error: "title required" }, { status: 400 });
  }
  const status = body.status != null ? parseTaskStatus(body.status) : undefined;
  const dueAt =
    typeof body.dueAt === "string" || body.dueAt instanceof Date
      ? new Date(body.dueAt as string | Date)
      : undefined;

  const task = await addDealRoomTask({
    dealRoomId: id,
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description : undefined,
    status: status ?? undefined,
    assignedUserId: typeof body.assignedUserId === "string" ? body.assignedUserId : undefined,
    dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : undefined,
    actorUserId: auth.userId,
  });
  return Response.json({ task });
}
