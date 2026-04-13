import { NextResponse } from "next/server";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { rejectVisitRequest } from "@/lib/visits/reject-visit";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  let brokerNote: string | null = null;
  try {
    const b = await request.json();
    const o = b && typeof b === "object" ? (b as Record<string, unknown>) : {};
    brokerNote = typeof o.brokerNote === "string" ? o.brokerNote : null;
  } catch {
    /* optional */
  }

  try {
    await rejectVisitRequest(id, auth.user.id, brokerNote);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
