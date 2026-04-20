import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { getPendingReviewQueue } from "@/modules/legal/legal-review.service";
import { requireLegalHubReviewer } from "@/modules/legal/services/require-legal-reviewer";

export const dynamic = "force-dynamic";

/** GET — broker/admin queue (aggregates only; no signed URLs). */
export async function GET() {
  if (!legalHubFlags.legalHubV1 || !legalHubFlags.legalReviewV1) {
    return NextResponse.json({ error: "Legal review queue is disabled" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const gate = requireLegalHubReviewer(auth.user);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 403 });
  }

  const queue = await getPendingReviewQueue();

  return NextResponse.json({
    pendingDocuments: queue.pendingDocuments.map((d) => ({
      id: d.id,
      userId: d.userId,
      workflowType: d.workflowType,
      requirementId: d.requirementId,
      actorType: d.actorType,
      status: d.status,
      fileName: d.fileName,
      fileType: d.fileType,
      uploadedAt: d.uploadedAt,
      workflowSubmissionId: d.workflowSubmissionId,
    })),
    pendingWorkflows: queue.pendingWorkflows.map((w) => ({
      id: w.id,
      userId: w.userId,
      workflowType: w.workflowType,
      actorType: w.actorType,
      status: w.status,
      submittedAt: w.submittedAt,
    })),
    generatedAt: new Date().toISOString(),
  });
}
