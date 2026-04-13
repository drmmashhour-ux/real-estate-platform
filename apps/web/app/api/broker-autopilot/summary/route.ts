import { NextResponse } from "next/server";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { getBrokerAutopilotDashboardSummary } from "@/lib/broker-autopilot/dashboard-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const summary = await getBrokerAutopilotDashboardSummary(auth.user.id, auth.user.role === "ADMIN");
  return NextResponse.json(summary);
}
