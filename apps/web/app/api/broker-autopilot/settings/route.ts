import { NextRequest, NextResponse } from "next/server";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { getOrCreateBrokerAutopilotSettings } from "@/lib/broker-autopilot/get-settings";
import { parseAutopilotSettingsBody } from "@/lib/broker-autopilot/validators";
import { updateBrokerAutopilotSettings } from "@/lib/broker-autopilot/update-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const settings = await getOrCreateBrokerAutopilotSettings(auth.user.id);
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const patch = parseAutopilotSettingsBody(body);
  if (!patch || Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const settings = await updateBrokerAutopilotSettings(auth.user.id, patch);
  return NextResponse.json({ settings });
}
