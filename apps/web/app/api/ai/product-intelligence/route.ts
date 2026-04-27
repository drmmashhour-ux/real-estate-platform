import { getProductActions, getProductInsights } from "@/lib/ai/productIntelligence";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { trackEvent } from "@/src/services/analytics";

export const dynamic = "force-dynamic";

/**
 * Read-only product intelligence (Order 57). No mutations; recommendations only.
 * Analytics: fires `product_insight_viewed` for JSON consumers.
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return Response.json({ error: admin.error }, { status: admin.status });
  }

  const [insights, actions] = await Promise.all([getProductInsights(), getProductActions()]);
  void trackEvent("product_insight_viewed", { insightCount: insights.length }, { userId: admin.userId });
  return Response.json(
    { insights, actions },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
