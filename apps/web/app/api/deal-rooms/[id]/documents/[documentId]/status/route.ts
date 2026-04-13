import { assertDealRoomAccess } from "@/lib/deals/access";
import { updateDealRoomDocumentStatus } from "@/lib/deals/update-document-status";
import { parseDocumentStatus } from "@/lib/deals/validators";
import { requireBrokerLikeApi } from "@/lib/forms/require-broker";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const auth = await requireBrokerLikeApi();
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const { id, documentId } = await params;
  const access = await assertDealRoomAccess(id, auth.userId, auth.role);
  if (!access.ok) {
    return Response.json({ error: "Not found" }, { status: access.status });
  }

  let body: { status?: unknown };
  try {
    body = (await req.json()) as { status?: unknown };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const status = parseDocumentStatus(body.status);
  if (!status) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const document = await updateDealRoomDocumentStatus({
      dealRoomId: id,
      documentId,
      status,
      actorUserId: auth.userId,
    });
    return Response.json({ document });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
