import { complianceAdminFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { listComplianceCases } from "@/modules/compliance-admin/compliance-admin.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  if (!complianceAdminFlags.adminComplianceCommandCenterV1) {
    return Response.json({ error: "Compliance command center disabled" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const severity = url.searchParams.get("severity") ?? undefined;
  const take = Math.min(200, parseInt(url.searchParams.get("take") ?? "80", 10) || 80);

  const cases = await listComplianceCases({ status, severity, take });
  return Response.json({ cases });
}
