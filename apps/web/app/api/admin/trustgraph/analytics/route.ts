import { computeTrustgraphAggregateMetrics } from "@/lib/trustgraph/infrastructure/services/trustgraphAnalyticsService";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireTrustgraphAdmin();
  if (auth instanceof Response) return auth;

  const metrics = await computeTrustgraphAggregateMetrics();
  return trustgraphJsonOk({ metrics });
}
