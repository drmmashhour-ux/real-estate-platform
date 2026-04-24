import { NextResponse } from "next/server";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";
import { discoverOpportunities } from "@/modules/opportunity-discovery/opportunity-discovery.engine";

export const dynamic = "force-dynamic";

export async function POST() {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const result = await discoverOpportunities({
    brokerUserId: actor.userId,
    persist: true,
    actorUserId: actor.userId,
  });

  return NextResponse.json({
    success: true,
    persisted: result.persisted,
    count: result.opportunities.length,
  });
}
