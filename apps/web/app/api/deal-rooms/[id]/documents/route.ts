import { assertDealRoomAccess } from "@/lib/deals/access";
import { addDealRoomDocument } from "@/lib/deals/add-document";
import { parseDocumentRefType, parseDocumentStatus } from "@/lib/deals/validators";
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
    documentType?: unknown;
    documentRefType?: unknown;
    documentRefId?: unknown;
    status?: unknown;
    title?: unknown;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const documentRefType = parseDocumentRefType(body.documentRefType);
  if (!documentRefType) {
    return Response.json({ error: "Invalid documentRefType" }, { status: 400 });
  }
  if (typeof body.documentType !== "string" || typeof body.title !== "string") {
    return Response.json({ error: "documentType and title required" }, { status: 400 });
  }
  const status = body.status != null ? parseDocumentStatus(body.status) : undefined;

  const doc = await addDealRoomDocument({
    dealRoomId: id,
    documentType: body.documentType,
    documentRefType,
    documentRefId: typeof body.documentRefId === "string" ? body.documentRefId : undefined,
    status: status ?? undefined,
    title: body.title,
    actorUserId: auth.userId,
  });
  return Response.json({ document: doc });
}
