import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { createAuditLog, listAuditLogs } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const audit = await listAuditLogs(documentId);
  const comments = audit.filter((a) => a.actionType === "comment_added");
  return NextResponse.json({ comments });
}

export async function POST(req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  const sectionKey = body.sectionKey ? String(body.sectionKey) : null;
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

  const row = await createAuditLog({
    documentId,
    actorUserId: auth.userId!,
    actionType: "comment_added",
    metadata: { text, sectionKey },
  });

  return NextResponse.json({ comment: row });
}
