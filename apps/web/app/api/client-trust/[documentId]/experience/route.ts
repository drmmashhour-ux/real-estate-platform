import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { composeClientTrustExperience } from "@/src/modules/client-trust-experience/application/composeClientTrustExperience";
import { buildTransparencyTimeline } from "@/src/modules/client-trust-experience/infrastructure/transparencyFromAudit";
import { getDocumentWorkflow } from "@/src/modules/legal-workflow/application/getDocumentWorkflow";
import { runDeclarationValidation } from "@/src/modules/seller-declaration-ai/application/runDeclarationValidation";

export async function GET(_req: Request, context: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await context.params;
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const workflow = await getDocumentWorkflow(documentId);
  if (!workflow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const payload = (workflow.document.draftPayload ?? {}) as Record<string, unknown>;
  const validation = await runDeclarationValidation({ payload, actorUserId: auth.userId! });
  const bundle = composeClientTrustExperience(
    payload,
    validation,
    workflow.document.aiSummary as Record<string, unknown> | null | undefined,
  );
  const transparency = buildTransparencyTimeline((workflow.audit ?? []) as Parameters<typeof buildTransparencyTimeline>[0]);

  return NextResponse.json({
    ...bundle,
    transparency,
    validation: {
      completenessPercent: validation.completenessPercent,
      contradictionCount: validation.contradictionFlags.length,
      warningCount: validation.warningFlags.length,
    },
    document: {
      id: workflow.document.id,
      listingId: workflow.document.listingId,
      status: workflow.document.status,
      updatedAt: workflow.document.updatedAt,
    },
  });
}
