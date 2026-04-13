import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { scoreBrokerCrmLead } from "@/lib/broker-crm/score-lead";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await scoreBrokerCrmLead(id);
  return NextResponse.json(out);
}
