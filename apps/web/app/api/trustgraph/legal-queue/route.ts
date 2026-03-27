import { listLegalQueueCaseIds } from "@/lib/trustgraph/infrastructure/services/legalQueueService";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { isTrustGraphEnabled, isTrustGraphLegalSlaEnabled } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isTrustGraphEnabled() || !isTrustGraphLegalSlaEnabled()) {
    return trustgraphJsonError("Legal SLA queue disabled", 503);
  }

  const auth = await requireTrustgraphAdmin();
  if (auth instanceof Response) return auth;

  const sp = new URL(request.url).searchParams;
  const workspaceId = sp.get("workspaceId");
  const caseIds = await listLegalQueueCaseIds(workspaceId, 200);
  return trustgraphJsonOk({ caseIds });
}
