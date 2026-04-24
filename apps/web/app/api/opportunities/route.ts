import { NextRequest, NextResponse } from "next/server";
import { requireExecutionActor } from "@/modules/lecipm-autonomous-execution/execution-api-guard";
import { opportunityFiltersFromSearchParams } from "@/modules/opportunity-discovery/opportunity-api-params";
import { listStoredOpportunities } from "@/modules/opportunity-discovery/opportunity-query.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await requireExecutionActor();
  if (!actor.ok) return actor.response;

  const filters = opportunityFiltersFromSearchParams(req.nextUrl.searchParams);
  const rows = await listStoredOpportunities(actor.userId, filters);
  return NextResponse.json({ opportunities: rows });
}
