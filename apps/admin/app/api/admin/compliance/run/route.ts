import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { runComplianceEngineForDeal } from "@/modules/compliance-admin/compliance-admin.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.complianceRuleEngineV1) {
    return Response.json({ error: "Compliance rule engine disabled" }, { status: 403 });
  }

  let body: { dealId?: string };
  try {
    body = (await request.json()) as { dealId?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.dealId) {
    return Response.json({ error: "dealId required" }, { status: 400 });
  }

  const result = await runComplianceEngineForDeal(body.dealId, admin.userId);
  return Response.json(result);
}
