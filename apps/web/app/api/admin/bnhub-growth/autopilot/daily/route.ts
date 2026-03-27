import { NextRequest } from "next/server";
import { dailyOptimizationJob, runConnectorHealthChecks } from "@/src/modules/bnhub-growth-engine/automations/autopilotEngine";
import {
  unauthorizedGrowthAutomation,
  verifyBnhubGrowthAutomationRequest,
} from "@/lib/server/bnhub-growth-internal-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) {
    return unauthorizedGrowthAutomation();
  }
  const opt = await dailyOptimizationJob();
  await runConnectorHealthChecks();
  return Response.json({ ok: true, optimization: opt });
}
