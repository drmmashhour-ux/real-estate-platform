import { NextRequest, NextResponse } from "next/server";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { snoozeAutopilotAction } from "@/lib/broker-autopilot/snooze-action";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Params) {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const untilRaw = o.until ?? o.snoozedUntil;
  if (typeof untilRaw !== "string") {
    return NextResponse.json({ error: "until (ISO date) required" }, { status: 400 });
  }
  const until = new Date(untilRaw);
  if (Number.isNaN(until.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const action = await snoozeAutopilotAction(id, auth.user.id, auth.user.role === "ADMIN", until);
    return NextResponse.json({ action });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
