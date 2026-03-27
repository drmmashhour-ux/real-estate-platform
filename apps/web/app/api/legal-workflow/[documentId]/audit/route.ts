import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { listAuditLogs } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  const audit = await listAuditLogs(documentId);
  return NextResponse.json({ audit });
}
