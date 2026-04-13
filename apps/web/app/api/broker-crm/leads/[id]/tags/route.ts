import { NextRequest, NextResponse } from "next/server";
import { addBrokerCrmTag } from "@/lib/broker-crm/add-tag";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { parseTag } from "@/lib/broker-crm/validators";
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
  const parsed = parseTag(o.tag);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const tag = await addBrokerCrmTag(id, parsed.tag);
  return NextResponse.json({ tag: { id: tag.id, tag: tag.tag } });
}
