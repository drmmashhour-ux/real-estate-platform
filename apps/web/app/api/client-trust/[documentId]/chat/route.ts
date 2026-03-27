import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { generateClientSummary } from "@/src/modules/client-trust-experience/application/generateClientSummary";
import { answerClientTrustQuestion } from "@/src/modules/client-trust-experience/infrastructure/clientTrustChatService";
import { getDocumentWorkflow } from "@/src/modules/legal-workflow/application/getDocumentWorkflow";
import { runDeclarationValidation } from "@/src/modules/seller-declaration-ai/application/runDeclarationValidation";

export async function POST(req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const workflow = await getDocumentWorkflow(documentId);
  if (!workflow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const payload = (workflow.document.draftPayload ?? {}) as Record<string, unknown>;
  const validation = await runDeclarationValidation({ payload, actorUserId: auth.userId! });
  const summary = generateClientSummary(payload, workflow.document.aiSummary as Record<string, unknown> | null);
  const docSummary = [
    summary.priceLine,
    ...summary.conditions.slice(0, 2),
    `Completeness: ${validation.completenessPercent}%`,
  ]
    .filter(Boolean)
    .join(" | ");

  const out = await answerClientTrustQuestion({
    message,
    documentSummary: docSummary,
    documentStatus: String(workflow.document.status),
  });
  return NextResponse.json(out);
}
