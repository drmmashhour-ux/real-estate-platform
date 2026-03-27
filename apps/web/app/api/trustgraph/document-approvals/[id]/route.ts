import { getDocumentApprovalStatus } from "@/lib/trustgraph/application/getDocumentApprovalStatus";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession, resolveWorkspaceAccess } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { isTrustGraphDocumentApprovalsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { z } from "zod";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphDocumentApprovalsEnabled()) {
    return trustgraphJsonError("Document approvals disabled", 503);
  }

  const raw = await context.params;
  const parsed = paramsSchema.safeParse(raw);
  if (!parsed.success) return trustgraphJsonError("Invalid id", 400, parsed.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;

  const flow = await getDocumentApprovalStatus(parsed.data.id);
  if (!flow) return trustgraphJsonError("Not found", 404);

  if (flow.workspaceId) {
    const access = await resolveWorkspaceAccess(flow.workspaceId, session.userId);
    if (access instanceof Response) return access;
  } else if (!(await isPlatformAdmin(session.userId))) {
    return trustgraphJsonError("Forbidden", 403);
  }

  return trustgraphJsonOk({
    safe: {
      flowId: flow.flowId,
      entityType: flow.entityType,
      entityId: flow.entityId,
      documentType: flow.documentType,
      currentStatus: flow.currentStatus,
      steps: flow.steps.map((s) => ({ stepKind: s.stepKind, status: s.status })),
    },
    ...(flow.workspaceId && (await isPlatformAdmin(session.userId))
      ? { admin: { steps: flow.steps, workspaceId: flow.workspaceId } }
      : {}),
  });
}
