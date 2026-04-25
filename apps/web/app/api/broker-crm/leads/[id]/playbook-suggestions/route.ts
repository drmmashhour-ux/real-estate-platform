import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import {
  getLeadRecommendations,
  tryAssignPlaybookForBrokerLeadSuggestions,
} from "@/modules/crm/services/broker-crm-playbook.service";
import { playbookLearningBridge } from "@/modules/playbook-memory/services/playbook-learning-bridge.service";
import { crmLearningLog } from "@/modules/playbook-memory/playbook-learning-logger";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Playbook-memory for CRM UI. Default: recommendations only (no automation).
 * Optional `?withAssignment=1`: creates an auditable playbookAssignment row + links learning (same policy as autopilot; still no outbound execution).
 */
export async function GET(request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recommendations = await getLeadRecommendations(id);
  const url = new URL(request.url);
  const withAssignment =
    url.searchParams.get("withAssignment") === "1" || url.searchParams.get("withAssignment") === "true";
  let assignment: Awaited<ReturnType<typeof tryAssignPlaybookForBrokerLeadSuggestions>> = null;
  if (withAssignment) {
    try {
      assignment = await tryAssignPlaybookForBrokerLeadSuggestions(id);
      if (assignment?.assignmentId) {
        crmLearningLog.info("suggestions_panel_assigned", { leadId: id, assignmentId: assignment.assignmentId });
        try {
          playbookLearningBridge.afterBrokerLeadAutopilotEvaluate({ leadId: id, assignment });
        } catch {
          /* */
        }
      }
    } catch {
      assignment = null;
    }
  }
  return NextResponse.json({
    ok: true,
    leadId: id,
    recommendations,
    ...(withAssignment ? { assignment } : {}),
    note: withAssignment
      ? "Assignment created for learning audit when withAssignment=1 — still suggest-only; no auto-messages."
      : "Recommendations only. Pass withAssignment=1 to create an auditable assignment row for the learning loop.",
  });
}
