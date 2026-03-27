import { applyDocumentApprovalAction } from "@/lib/trustgraph/application/applyDocumentApprovalAction";
import { getDocumentApprovalStatus } from "@/lib/trustgraph/application/getDocumentApprovalStatus";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { trustgraphJsonError, trustgraphJsonOk } from "@/lib/trustgraph/infrastructure/auth/http";
import { requireWorkspaceSession, resolveWorkspaceAccess } from "@/lib/trustgraph/infrastructure/auth/requireWorkspaceAccess";
import { documentApprovalActionSchema } from "@/lib/trustgraph/infrastructure/validation/workspaceRouteSchemas";
import { isTrustGraphDocumentApprovalsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { z } from "zod";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustGraphEnabled() || !isTrustGraphDocumentApprovalsEnabled()) {
    return trustgraphJsonError("Document approvals disabled", 503);
  }

  const raw = await context.params;
  const parsedParams = paramsSchema.safeParse(raw);
  if (!parsedParams.success) return trustgraphJsonError("Invalid id", 400, parsedParams.error.flatten());

  const session = await requireWorkspaceSession();
  if (session instanceof Response) return session;

  const flow = await getDocumentApprovalStatus(parsedParams.data.id);
  if (!flow) return trustgraphJsonError("Not found", 404);

  if (flow.workspaceId) {
    const access = await resolveWorkspaceAccess(flow.workspaceId, session.userId);
    if (access instanceof Response) return access;
  } else if (!(await isPlatformAdmin(session.userId))) {
    return trustgraphJsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return trustgraphJsonError("Invalid JSON", 400);
  }
  const parsed = documentApprovalActionSchema.safeParse(body);
  if (!parsed.success) return trustgraphJsonError("Invalid body", 400, parsed.error.flatten());

  const result = await applyDocumentApprovalAction({
    flowId: parsedParams.data.id,
    actorId: session.userId,
    actionType: parsed.data.actionType,
    notes: parsed.data.notes,
    targetUserId: parsed.data.targetUserId,
  });

  if ("error" in result && result.error) {
    return trustgraphJsonError(result.error === "not_found" ? "Not found" : "Unavailable", result.error === "not_found" ? 404 : 503);
  }

  return trustgraphJsonOk({ ok: true });
}
