import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { runConnectorHealthChecks } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  await runConnectorHealthChecks();
  return Response.json({ ok: true });
}
