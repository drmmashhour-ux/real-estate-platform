import { NextResponse } from "next/server";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { prepareExecuteAutopilotAction } from "@/lib/broker-autopilot/execute-approved-action";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Returns thread + draft for broker composer; marks action as queued. */
export async function POST(_request: Request, context: Params) {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  try {
    const payload = await prepareExecuteAutopilotAction(id, auth.user.id, auth.user.role === "ADMIN");
    await prisma.lecipmBrokerAutopilotAction.update({
      where: { id },
      data: { status: "queued" },
    });
    return NextResponse.json({ ...payload, aiGeneratedDraft: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
