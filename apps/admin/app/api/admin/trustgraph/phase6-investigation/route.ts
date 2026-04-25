import { buildTrustgraphInvestigationDashboard } from "@/lib/trustgraph/infrastructure/services/trustgraphInvestigationService";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireTrustgraphAdmin();
  if (auth instanceof Response) return auth;

  const dashboard = await buildTrustgraphInvestigationDashboard();
  return trustgraphJsonOk({ dashboard });
}
