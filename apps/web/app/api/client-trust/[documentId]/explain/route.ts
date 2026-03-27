import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { generateSectionExplanation } from "@/src/modules/client-trust-experience/application/generateSectionExplanation";
import { getDocumentWorkflow } from "@/src/modules/legal-workflow/application/getDocumentWorkflow";

export async function POST(req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const sectionKey = String(body.sectionKey ?? "");
  if (!sectionKey) return NextResponse.json({ error: "sectionKey required" }, { status: 400 });

  const workflow = await getDocumentWorkflow(documentId);
  if (!workflow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const payload = (workflow.document.draftPayload ?? {}) as Record<string, unknown>;
  const explanation = generateSectionExplanation(sectionKey, payload);
  return NextResponse.json(explanation);
}
