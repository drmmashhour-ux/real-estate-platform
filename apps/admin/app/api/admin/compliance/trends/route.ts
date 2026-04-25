import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getCaseSeverityTrends } from "@/modules/compliance-analytics/risk-trends.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.adminComplianceCommandCenterV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const days = Math.min(180, Math.max(7, parseInt(new URL(request.url).searchParams.get("days") ?? "30", 10) || 30));
  const trends = await getCaseSeverityTrends(days);
  return Response.json({ trends, days });
}
