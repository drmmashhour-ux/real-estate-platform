import { listWorkspaceCases } from "@/lib/trustgraph/application/listWorkspaceCases";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { requireWorkspaceReviewer } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceReviewer";
import { workspaceIdParamsSchema } from "@/lib/trustgraph/infrastructure/validation/workspaceRouteSchemas";
import { isTrustGraphEnabled, isTrustGraphEnterpriseWorkspacesEnabled } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ workspaceId: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphEnterpriseWorkspacesEnabled()) {
    return trustgraphJsonError("Enterprise workspaces disabled", 503);
  }

  const raw = await context.params;
  const parsed = workspaceIdParamsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid workspace", 400, parsed.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;

  const access = await requireWorkspaceReviewer(parsed.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  const items = await listWorkspaceCases(parsed.data.workspaceId, 100);
  return trustgraphJsonOk({ items });
}
