import { NextResponse } from "next/server";
import { requireDocumentAccess } from "@/app/api/legal-workflow/_auth";
import { runSafeWorkflowAutomations } from "@/src/modules/autonomous-workflow-assistant/application/runSafeWorkflowAutomations";
import { WorkflowTriggerType } from "@/src/modules/autonomous-workflow-assistant/domain/autonomousWorkflow.enums";
import type { ResolutionSnapshot } from "@/src/modules/autonomous-workflow-assistant/infrastructure/taskResolutionService";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const documentId = String(body.documentId ?? "");
  const auth = await requireDocumentAccess(documentId);
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: auth.status });

  const triggerType = (body.triggerType ?? WorkflowTriggerType.DOCUMENT_UPDATED) as (typeof WorkflowTriggerType)[keyof typeof WorkflowTriggerType];
  const steps = (body.steps ?? []) as Array<any>;
  const actions = (body.actions ?? []) as Array<{ actionType: string; payload?: Record<string, unknown> }>;

  const resolutionSnapshot = body.resolutionSnapshot as ResolutionSnapshot | undefined;

  const result = await runSafeWorkflowAutomations({
    documentId,
    actorUserId: auth.userId,
    triggerType,
    steps: steps.length ? steps : undefined,
    actions: actions.length ? actions : undefined,
    resolutionSnapshot,
  });
  return NextResponse.json(result);
}
