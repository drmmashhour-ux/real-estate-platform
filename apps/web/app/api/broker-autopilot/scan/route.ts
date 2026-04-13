import { NextResponse } from "next/server";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { scanBrokerAutopilotLeads } from "@/lib/broker-autopilot/scan-leads";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await scanBrokerAutopilotLeads(auth.user.id, auth.user.role === "ADMIN");
  return NextResponse.json(result);
}
