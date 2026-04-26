import { investorDemoMetrics } from "@/lib/demo/demoData";
import { isDemoMode } from "@/lib/demo/isDemoMode";
import { getPlatformMetrics } from "@/lib/services/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDemoMode) {
    return Response.json({ ...investorDemoMetrics, _demo: true as const });
  }
  return Response.json(await getPlatformMetrics());
}
