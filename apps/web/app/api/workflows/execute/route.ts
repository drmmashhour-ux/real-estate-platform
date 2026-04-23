import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { executeWorkflow } from "@/lib/workflows/executor";
import { workflowToClientDto } from "@/lib/workflows/dto";
import { WorkflowSafetyError } from "@/lib/workflows/safety";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  workflowId: z.string().min(1),
  regulatedConfirmed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.aIWorkflow.findFirst({
    where: { id: parsed.data.workflowId, ownerId: auth.id },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  try {
    await executeWorkflow(parsed.data.workflowId, {
      regulatedConfirmed: parsed.data.regulatedConfirmed,
    });

    const wf = await prisma.aIWorkflow.findUnique({
      where: { id: parsed.data.workflowId },
    });

    await recordAuditEvent({
      actorUserId: auth.id,
      action: "AI_WORKFLOW_EXECUTED",
      payload: { workflowId: parsed.data.workflowId, type: existing.type, status: wf?.status },
    });

    return NextResponse.json({
      success: true,
      workflow: wf ? workflowToClientDto(wf) : null,
    });
  } catch (e) {
    if (e instanceof WorkflowSafetyError) {
      return NextResponse.json({ success: false, error: e.code }, { status: 422 });
    }
    const msg = e instanceof Error ? e.message : "Execute failed";
    const status =
      msg === "APPROVAL_REQUIRED" || msg === "REGULATED_ACTION_REQUIRES_APPROVAL"
        ? 409
        : msg === "WORKFLOW_ALREADY_COMPLETED" || msg === "WORKFLOW_ALREADY_EXECUTING"
          ? 409
          : 500;
    await recordAuditEvent({
      actorUserId: auth.id,
      action: "AI_WORKFLOW_EXECUTE_FAILED",
      payload: { workflowId: parsed.data.workflowId, error: msg },
    }).catch(() => {});
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
