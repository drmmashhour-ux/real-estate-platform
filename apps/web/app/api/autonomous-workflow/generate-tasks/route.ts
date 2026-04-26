import { NextResponse } from "next/server";
import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { generateAutonomousTasks } from "@/src/modules/autonomous-workflow-assistant/application/generateAutonomousTasks";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";

/** Persists autonomous workflow tasks from current document + graph state (admin/reviewer use). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const doc = await prisma.sellerDeclarationDraft.findUnique({ where: { id: documentId } });
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

  const summary = await getLegalGraphSummary(doc.listingId).catch(() => null);
  const result = await generateAutonomousTasks({
    documentId,
    propertyId: doc.listingId,
    status: doc.status,
    draftPayload: (doc.draftPayload ?? {}) as Record<string, unknown>,
    blockingIssues: summary?.blockingIssues ?? [],
    graphFileHealth: summary?.fileHealth,
    missingDependencies: summary?.missingDependencies ?? [],
    signatureReady: summary?.signatureReadiness?.ready ?? false,
    signatureReasons: summary?.signatureReadiness?.reasons ?? [],
    criticalGraphIssueCount: summary?.criticalOpenCount ?? 0,
    actorUserId: auth.userId,
  });
  captureServerEvent(auth.userId, "autonomous_task_created", { documentId, persisted: result.created.length });
  return NextResponse.json(result);
}
