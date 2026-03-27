import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { getDocumentWorkflow } from "@/src/modules/legal-workflow/application/getDocumentWorkflow";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });
  const workflow = await getDocumentWorkflow(documentId);
  if (!workflow) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(workflow);
}
