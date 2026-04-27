import { getInvestorMetrics } from "@/lib/finance/investorMetrics";
import { requireAdminSession } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/finance/investor-metrics — **admin** LECIPM marketplace revenue snapshot (Order 61).
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }
  const metrics = await getInvestorMetrics();
  return Response.json({ metrics });
}
