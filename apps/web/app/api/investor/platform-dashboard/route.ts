import { investorPlatformDemoMetrics } from "@/lib/demo/demoData";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { getInvestorDashboard } from "@/lib/services/investorDashboard";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const want = process.env.ADMIN_SECRET;
  if (want == null || want === "") {
    return false;
  }
  return req.headers.get("x-admin-secret") === want;
}

/**
 * Admin-only: core KPIs, growth funnel, revenue, and AI impact counts.
 * (Distinct from `GET /api/investor/dashboard`, which is the investor-portfolio session API.)
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (isDemoMode) {
    return Response.json({
      ...investorPlatformDemoMetrics,
      _demo: true as const,
    });
  }
  const data = await getInvestorDashboard();
  return Response.json({
    ...data,
    _demo: false as const,
  });
}
