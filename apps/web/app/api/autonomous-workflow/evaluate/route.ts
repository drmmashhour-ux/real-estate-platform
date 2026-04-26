import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { logError } from "@/lib/logger";
import { getCaseLegalSummary } from "@/src/modules/case-command-center/application/getCaseLegalSummary";
import { LECIPM_WORKFLOW_EVALUATE_FALLBACK } from "@/src/modules/case-command-center/application/lecipmTrustCopy";
import { buildResolutionSnapshot, evaluateWorkflowNextSteps } from "@/src/modules/autonomous-workflow-assistant/application/evaluateWorkflowNextSteps";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId } });
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const payload = (doc.draftPayload ?? {}) as Record<string, unknown>;

  try {
    /** Same legal graph pipeline as getCaseHealthSnapshot (build graph for document, then summary). */
    const legal = await getCaseLegalSummary(documentId, auth.userId ?? undefined);
    if (!legal) return NextResponse.json({ error: "not found" }, { status: 404 });

    const summary = legal.summary;
    const blockingIssues = summary.blockingIssues ?? [];
    const steps = evaluateWorkflowNextSteps({
      documentId,
      status: doc.status,
      draftPayload: payload,
      blockingIssues,
      graphFileHealth: summary.fileHealth,
      missingDependencies: summary.missingDependencies ?? [],
      signatureReady: summary.signatureReadiness?.ready,
      signatureReasons: summary.signatureReadiness?.reasons ?? [],
      criticalGraphIssueCount: summary.criticalOpenCount ?? 0,
    });
    const resolutionSnapshot = buildResolutionSnapshot({ draftPayload: payload, blockingIssues });

    return NextResponse.json({ steps, resolutionSnapshot });
  } catch (e) {
    logError("POST /api/autonomous-workflow/evaluate", e);
    return NextResponse.json({
      steps: [],
      resolutionSnapshot: buildResolutionSnapshot({ draftPayload: payload, blockingIssues: [] }),
      error: LECIPM_WORKFLOW_EVALUATE_FALLBACK,
    });
  }
}
