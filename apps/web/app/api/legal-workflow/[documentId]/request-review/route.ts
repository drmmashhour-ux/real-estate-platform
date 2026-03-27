import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { requestDocumentReview } from "@/src/modules/legal-workflow/application/requestDocumentReview";

export async function POST(req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const row = await requestDocumentReview({ documentId, actorUserId: auth.userId!, note: String(body.note ?? "") });
  return NextResponse.json({ document: { id: row.id, status: row.status } });
}
