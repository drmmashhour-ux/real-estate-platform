import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { campaignLaunchScanJob } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const r = await campaignLaunchScanJob(body.limit ?? 25);
  return Response.json({ ok: true, ...r });
}
