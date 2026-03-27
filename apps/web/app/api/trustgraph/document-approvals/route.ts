import { startDocumentApprovalFlow } from "@/lib/trustgraph/application/startDocumentApprovalFlow";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession, resolveWorkspaceAccess } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { documentApprovalStartSchema } from "@/lib/trustgraph/infrastructure/validation/workspaceRouteSchemas";
import { isTrustGraphDocumentApprovalsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustGraphEnabled() || !isTrustGraphDocumentApprovalsEnabled()) {
    return trustgraphJsonError("Document approvals disabled", 503);
  }

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return trustgraphJsonError("Invalid JSON", 400);
  }
  const parsed = documentApprovalStartSchema.safeParse(body);
  if (!parsed.success) return trustgraphJsonError("Invalid body", 400, parsed.error.flatten());

  if (parsed.data.workspaceId) {
    const access = await resolveWorkspaceAccess(parsed.data.workspaceId, session.userId);
    if (access instanceof Response) return access;
  } else if (!(await isPlatformAdmin(session.userId))) {
    return trustgraphJsonError("Forbidden", 403);
  }

  const result = await startDocumentApprovalFlow({
    entityType: parsed.data.entityType,
    entityId: parsed.data.entityId,
    documentType: parsed.data.documentType,
    workspaceId: parsed.data.workspaceId ?? null,
    startedBy: session.userId,
  });

  if ("skipped" in result && result.skipped) {
    return trustgraphJsonError("Document approvals unavailable", 503);
  }

  return trustgraphJsonOk({ flowId: "flowId" in result ? result.flowId : null });
}
