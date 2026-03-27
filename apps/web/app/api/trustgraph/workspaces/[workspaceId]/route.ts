import { getComplianceWorkspace } from "@/lib/trustgraph/application/getComplianceWorkspace";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession, resolveWorkspaceAccess } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
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

  const access = await resolveWorkspaceAccess(parsed.data.workspaceId, session.userId);
  if (access instanceof Response) return access;

  const ws = await getComplianceWorkspace(parsed.data.workspaceId);
  if (!ws) return trustgraphJsonError("Not found", 404);

  const safe = {
    id: ws.id,
    name: ws.name,
    orgType: ws.orgType,
    orgId: ws.orgId,
  };

  const admin =
    access.kind === "platform_admin"
      ? { settings: ws.settings, branding: ws.branding }
      : access.member.role === "workspace_admin" || access.member.role === "workspace_manager"
        ? { settings: ws.settings, branding: ws.branding }
        : undefined;

  return trustgraphJsonOk({ safe, ...(admin ? { admin } : {}) });
}
