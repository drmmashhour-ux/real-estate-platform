import { isTrustGraphAdminQueueEnabled } from "@/lib/trustgraph/config";
import { loadVerificationQueue } from "@/lib/trustgraph/application/loadVerificationQueue";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";
import { queueQuerySchema } from "@/lib/trustgraph/infrastructure/validation/queueQuerySchema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isTrustGraphAdminQueueEnabled()) {
    return trustgraphJsonError("TrustGraph admin queue disabled", 503);
  }
  const auth = await requireTrustgraphAdmin();
  if (auth instanceof Response) return auth;

  const sp = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = queueQuerySchema.safeParse(sp);
  if (!parsed.success) {
    return trustgraphJsonError("Invalid query", 400, parsed.error.flatten());
  }

  const data = await loadVerificationQueue(parsed.data);
  return trustgraphJsonOk(data);
}
