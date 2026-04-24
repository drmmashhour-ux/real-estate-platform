import { NextResponse } from "next/server";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";
import { topStoredOpportunities } from "@/modules/opportunity-discovery/opportunity-query.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const opportunities = await topStoredOpportunities(actor.userId, 32);
  return NextResponse.json({ opportunities });
}
