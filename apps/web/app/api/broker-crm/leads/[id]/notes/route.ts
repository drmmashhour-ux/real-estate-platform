import { NextRequest, NextResponse } from "next/server";
import { addBrokerCrmNote } from "@/lib/broker-crm/add-note";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { parseNoteBody } from "@/lib/broker-crm/validators";
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
  const parsed = parseNoteBody(o.body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const note = await addBrokerCrmNote(id, auth.user.id, parsed.body);
  void import("@/modules/user-intelligence/integrations/crm-user-intelligence").then((m) =>
    m.recordBrokerCrmNoteSignal(auth.user.id, { leadId: id }).catch(() => {}),
  );
  return NextResponse.json({ note: { id: note.id, body: note.body, createdAt: note.createdAt.toISOString() } });
}
