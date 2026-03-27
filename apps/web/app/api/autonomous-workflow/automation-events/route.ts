import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { listWorkflowAutomationEvents } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowAutomationRepository";

/** Recent workflow automation events for a document (audit / activity feed). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const documentId = url.searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const events = await listWorkflowAutomationEvents({
    entityType: "seller_declaration_draft",
    entityId: documentId,
    take: 50,
  });
  return NextResponse.json({ events });
}
