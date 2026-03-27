import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { refreshAllBnhubListingEngines } from "@/src/modules/bnhub-growth-engine/services/bnhubListingEnginesOrchestrator";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json().catch(() => ({}))) as { listingId?: string };
  if (!body.listingId) return Response.json({ error: "listingId required" }, { status: 400 });
  await refreshAllBnhubListingEngines(body.listingId);
  return Response.json({ ok: true, listingId: body.listingId });
}
