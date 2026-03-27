import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { updateDocumentStatus } from "@/src/modules/legal-workflow/application/updateDocumentStatus";
import { NegotiationGateError } from "@/src/modules/negotiation-chain-engine/application/negotiationSignatureGuard";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const nextStatus = String(body.nextStatus ?? "");
  if (!documentId || !nextStatus) return NextResponse.json({ error: "documentId and nextStatus required" }, { status: 400 });

  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  try {
    const updated = await updateDocumentStatus({
      documentId,
      actorUserId: auth.userId!,
      nextStatus: nextStatus as any,
      metadata: body.metadata ?? {},
    });
    return NextResponse.json({ document: { id: updated.id, status: updated.status, updatedAt: updated.updatedAt } });
  } catch (e) {
    if (e instanceof NegotiationGateError) {
      return NextResponse.json({ error: e.message }, { status: e.httpStatus });
    }
    throw e;
  }
}
