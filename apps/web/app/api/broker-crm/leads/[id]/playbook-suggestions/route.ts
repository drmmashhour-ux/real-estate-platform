import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { getLeadRecommendations } from "@/modules/crm/services/broker-crm-playbook.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Read-only playbook-memory retrieval for CRM UI. Does not create assignments or autopilot rows.
 */
export async function GET(_request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recommendations = await getLeadRecommendations(id);
  return NextResponse.json({
    ok: true,
    leadId: id,
    recommendations,
    note: "Suggest-only — bandit assignment runs only from explicit autopilot evaluate paths.",
  });
}
