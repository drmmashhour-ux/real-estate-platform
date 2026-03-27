import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { dailyBatchRefreshEngines } from "@/src/modules/bnhub-growth-engine/services/bnhubListingEnginesOrchestrator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const r = await dailyBatchRefreshEngines(Math.min(200, body.limit ?? 80));
  return Response.json({ ok: true, ...r });
}
