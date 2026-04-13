import { NextRequest, NextResponse } from "next/server";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { listAutopilotActions, listOpenAutopilotActions } from "@/lib/broker-autopilot/list-actions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const actions = all
    ? await listAutopilotActions({
        brokerUserId: auth.user.id,
        isAdmin: auth.user.role === "ADMIN",
        take: 200,
      })
    : await listOpenAutopilotActions({
        brokerUserId: auth.user.id,
        isAdmin: auth.user.role === "ADMIN",
        take: 100,
      });

  return NextResponse.json({ actions });
}
