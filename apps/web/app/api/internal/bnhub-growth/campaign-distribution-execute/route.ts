import { NextRequest } from "next/server";
import {
  verifyBnhubGrowthAutomationRequest,
  unauthorizedGrowthAutomation,
} from "@/lib/server/bnhub-growth-internal-auth";
import { executeDistribution } from "@/src/modules/bnhub-growth-engine/services/distributionService";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyBnhubGrowthAutomationRequest(request)) return unauthorizedGrowthAutomation();
  const body = (await request.json()) as {
    distributionId: string;
    adminApprovedExternal?: boolean;
    confirmIrreversibleExternal?: boolean;
  };
  if (!body.distributionId) {
    return Response.json({ error: "distributionId required" }, { status: 400 });
  }
  const result = await executeDistribution(body.distributionId, {
    adminApprovedExternal: body.adminApprovedExternal === true,
    confirmIrreversibleExternal: body.confirmIrreversibleExternal === true,
    actorId: null,
  });
  return Response.json({ ok: true, result });
}
