import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { generateAiReplyDraft } from "@/lib/broker-crm/generate-ai-reply";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Params) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const out = await generateAiReplyDraft(id, auth.user.id);
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
