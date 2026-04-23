import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/requireAuthenticatedUser";
import { FeatureNotAvailableError, requireFeature } from "@/lib/featureGate";
import { generateWorkflowPlanFromMessage } from "@/lib/workflows/plan-from-ai";
import { createWorkflowFromPlan, enrichPlanWithRequestContext } from "@/lib/workflows/service";
import { workflowToClientDto } from "@/lib/workflows/dto";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";
import { WorkflowSafetyError } from "@/lib/workflows/safety";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().min(2).max(4000),
  context: z.unknown().optional(),
  ownerType: z.string().min(1).max(64).optional().default("user"),
});

/**
 * POST /api/workflows/generate — plan from natural language and persist as proposed workflow.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (auth instanceof NextResponse) return auth;

  if (process.env.COPILOT_SKIP_BILLING_GATE !== "true") {
    try {
      await requireFeature({ userId: auth.id, feature: "copilot" });
    } catch (e) {
      if (e instanceof FeatureNotAvailableError) {
        return NextResponse.json(
          { success: false, error: "Subscription required for AI workflows.", code: "feature_required" },
          { status: 403 }
        );
      }
      throw e;
    }
  }

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

  const ctx = parsed.data.context as { listingId?: string | null } | null | undefined;
  const listingId = ctx && typeof ctx === "object" && "listingId" in ctx ? (ctx.listingId as string | null) : null;

  try {
    const plan = await generateWorkflowPlanFromMessage(parsed.data.message, parsed.data.context ?? {});
    const enriched = enrichPlanWithRequestContext(plan, { listingId });
    const wf = await createWorkflowFromPlan(enriched, parsed.data.ownerType, auth.id);

    await recordAuditEvent({
      actorUserId: auth.id,
      action: "AI_WORKFLOW_CREATED",
      payload: { workflowId: wf.id, type: wf.type },
    });

    return NextResponse.json({ success: true, workflow: workflowToClientDto(wf) });
  } catch (e) {
    if (e instanceof WorkflowSafetyError) {
      return NextResponse.json({ success: false, error: e.code }, { status: 422 });
    }
    const msg = e instanceof Error ? e.message : "Workflow generate failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
