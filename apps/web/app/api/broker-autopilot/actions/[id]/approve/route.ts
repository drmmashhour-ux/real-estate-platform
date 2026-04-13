import { NextResponse } from "next/server";
import { approveAutopilotAction } from "@/lib/broker-autopilot/approve-action";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Params) {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  try {
    const action = await approveAutopilotAction(id, auth.user.id, auth.user.role === "ADMIN");
    return NextResponse.json({ action });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
