import { investorDemoMetrics } from "@/lib/demo/demoData";
import { isDemoMode } from "@/lib/demo/isDemoMode";

export const dynamic = "force-dynamic";

/**
 * Returns canned investor metrics. Prefer enabling only when `DEMO_MODE=1` in production
 * (handler still works without the flag for local demos).
 */
export async function GET() {
  if (!isDemoMode) {
    return Response.json(
      { error: "Set DEMO_MODE=1 to use investor demo data" },
      { status: 403 }
    );
  }
  return Response.json(investorDemoMetrics);
}
