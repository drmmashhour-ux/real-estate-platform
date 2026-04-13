import { NextRequest, NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { setBrokerCrmFollowUp } from "@/lib/broker-crm/set-follow-up";
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
  const raw = o.nextFollowUpAt;
  let at: Date | null = null;
  if (raw === null || raw === "") at = null;
  else if (typeof raw === "string") {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    at = d;
  } else return NextResponse.json({ error: "nextFollowUpAt required" }, { status: 400 });

  const updated = await setBrokerCrmFollowUp(id, at, auth.user.id);
  return NextResponse.json({ nextFollowUpAt: updated.nextFollowUpAt?.toISOString() ?? null });
}
