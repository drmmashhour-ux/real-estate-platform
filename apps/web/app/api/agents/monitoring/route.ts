import { NextResponse } from "next/server";
import { getExecutiveMonitoringSummary } from "@/modules/agents/executive-monitoring.service";
import { requireAgentsSession } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  const summary = await getExecutiveMonitoringSummary(auth.userId);
  return NextResponse.json(summary);
}
