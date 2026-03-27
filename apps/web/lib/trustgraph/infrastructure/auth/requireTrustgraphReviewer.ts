import { requireTrustgraphAdmin } from "@/lib/trustgraph/infrastructure/auth/requireTrustgraphAdmin";

/**
 * Human review actions (approve, reject, override, etc.).
 * Currently same gate as admin; extend here if a dedicated reviewer role is added.
 */
export async function requireTrustgraphReviewer(): Promise<{ userId: string } | Response> {
  return requireTrustgraphAdmin();
}
