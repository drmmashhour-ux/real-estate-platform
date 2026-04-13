import type { PlatformRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { listVisitsForLead } from "@/lib/visits/list-for-lead";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: leadId } = await context.params;
  const lead = await findLeadForBrokerScope(leadId, auth.user.id, auth.user.role as PlatformRole);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await listVisitsForLead(leadId, auth.user.id);
  return NextResponse.json(data);
}
