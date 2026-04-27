import { investorDemoMetrics } from "@/lib/demo/demoData";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { getCachedMetrics } from "@/lib/services/metrics-cache";

export const dynamic = "force-dynamic";

function isAuthorized(req: Request): boolean {
  const want = process.env.ADMIN_SECRET;
  if (want == null || want === "") {
    return false;
  }
  const got = req.headers.get("x-admin-secret");
  return got === want;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (isDemoMode) {
    console.warn("[DEMO MODE ACTIVE] /api/metrics — investor demo metrics (no live DB service path)");
    return Response.json({ ...investorDemoMetrics, _demo: true as const });
  }
  const data = await getCachedMetrics();
  return Response.json({ ...data, _demo: false as const });
}
