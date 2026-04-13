import { NextResponse } from "next/server";
import { findLeadForBrokerScope } from "@/lib/broker-crm/access";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { generateAutopilotNextAction } from "@/lib/broker-autopilot/generate-next-action";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Params) {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const lead = await findLeadForBrokerScope(id, auth.user.id, auth.user.role);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const result = await generateAutopilotNextAction(id, auth.user.id);
    return NextResponse.json({ ...result, aiGenerated: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
