import { NextResponse } from "next/server";
import { legalHubFlags } from "@/config/feature-flags";
import { requireUser } from "@/lib/auth/require-user";
import { LEGAL_HUB_ACTOR_TYPES } from "@/modules/legal/legal-hub-phase2.constants";
import { submitWorkflow } from "@/modules/legal/legal-workflow-submission.service";

export const dynamic = "force-dynamic";

/** POST JSON `{ workflowType, actorType }` — bundles checklist documents for broker/admin review (explicit human gate). */
export async function POST(req: Request) {
  if (
    !legalHubFlags.legalHubV1 ||
    !legalHubFlags.legalWorkflowSubmissionV1
  ) {
    return NextResponse.json({ error: "Legal workflow submission is disabled" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const o = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const workflowType = typeof o.workflowType === "string" ? o.workflowType.trim() : "";
  const actorType = typeof o.actorType === "string" ? o.actorType.trim() : "";

  if (!workflowType || !actorType) {
    return NextResponse.json({ error: "workflowType and actorType are required" }, { status: 400 });
  }
  if (!LEGAL_HUB_ACTOR_TYPES.has(actorType)) {
    return NextResponse.json({ error: "Invalid actor type" }, { status: 400 });
  }

  const result = await submitWorkflow({
    userId: auth.user.id,
    actorType,
    workflowType,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.message,
        ...("missingRequirementIds" in result && result.missingRequirementIds
          ? { missingRequirementIds: result.missingRequirementIds }
          : {}),
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ submission: result.submission });
}
