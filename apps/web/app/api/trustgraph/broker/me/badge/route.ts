import { getGuestId } from "@/lib/auth/session";
import { getBrokerTrustBadgeSafeDto } from "@/lib/trustgraph/application/integrations/brokerProfileIntegration";
import { isTrustGraphBrokerBadgeEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/config";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";

export const dynamic = "force-dynamic";

/**
 * Sanitized broker badge state for seller/broker UI (no internal fraud diagnostics).
 */
export async function GET() {
  if (!isTrustGraphEnabled()) {
    return trustgraphJsonError("TrustGraph disabled", 503);
  }
  if (!isTrustGraphBrokerBadgeEnabled()) {
    return trustgraphJsonOk({ enabled: false, badge: null });
  }
  const userId = await getGuestId();
  if (!userId) {
    return trustgraphJsonError("Unauthorized", 401);
  }

  const badge = await getBrokerTrustBadgeSafeDto(userId);
  return trustgraphJsonOk({ enabled: true, badge });
}
