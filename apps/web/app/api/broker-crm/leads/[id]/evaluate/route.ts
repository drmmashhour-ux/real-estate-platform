import { NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { evaluateLead } from "@/modules/crm/services/broker-crm-autopilot.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Run full broker autopilot evaluation (score + playbook-memory + safe internal suggestion). No messaging.
 */
export async function POST(_request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await evaluateLead(id);
  return NextResponse.json(out);
}
