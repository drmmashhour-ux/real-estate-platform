import { NextRequest, NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { updateBrokerCrmLeadStatus } from "@/lib/broker-crm/update-lead-status";
import { parseLeadStatus } from "@/lib/broker-crm/validators";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const st = parseLeadStatus(o.status);
  if (!st.ok) return NextResponse.json({ error: st.error }, { status: 400 });

  const updated = await updateBrokerCrmLeadStatus(id, st.status, auth.user.id);
  return NextResponse.json({ lead: { id: updated.id, status: updated.status } });
}
