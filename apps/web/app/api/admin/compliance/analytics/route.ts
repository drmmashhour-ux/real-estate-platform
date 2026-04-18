import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getComplianceAnalytics } from "@/modules/compliance-analytics/compliance-analytics.service";
import type { ComplianceAnalyticsWindow } from "@/modules/compliance-analytics/compliance-analytics.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.adminComplianceCommandCenterV1) {
    return Response.json({ error: "Disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as ComplianceAnalyticsWindow;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const analytics = await getComplianceAnalytics(window, custom);
  return Response.json({ analytics });
}
