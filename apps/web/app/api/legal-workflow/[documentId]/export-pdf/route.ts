import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { generateDeclarationPdf } from "@/src/modules/legal-workflow/infrastructure/generateDeclarationPdf";
import { createAuditLog, getDocumentById } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";
import { updateDocumentStatus } from "@/src/modules/legal-workflow/application/updateDocumentStatus";

export async function POST(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const doc = await getDocumentById(documentId);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const pdf = generateDeclarationPdf({
    documentId,
    payload: (doc.draftPayload ?? {}) as Record<string, unknown>,
    validationSummary: (doc.validationSummary as Record<string, unknown> | null) ?? null,
  });

  await createAuditLog({ documentId, actorUserId: auth.userId!, actionType: "exported", metadata: { fileName: pdf.fileName } });
  if (doc.status === "finalized") {
    await updateDocumentStatus({ documentId, actorUserId: auth.userId!, nextStatus: "exported", metadata: { exportedAt: pdf.generatedAtIso } });
  }

  return NextResponse.json(pdf);
}
