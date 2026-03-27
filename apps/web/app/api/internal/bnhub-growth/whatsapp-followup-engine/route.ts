import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { whatsappFollowupEngineJob } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json()) as { leadId: string };
  if (!body.leadId) return Response.json({ error: "leadId required" }, { status: 400 });
  const r = await whatsappFollowupEngineJob(body.leadId);
  return Response.json({
    ok: r.ok,
    summary: r.summary,
    setupRequired: "setupRequired" in r ? r.setupRequired : undefined,
    externalRef: "externalRef" in r ? r.externalRef : undefined,
  });
}
